#!/usr/bin/env python3
"""Vérifie que toutes les sources citées dans data/*.json répondent encore.

Gratuit, sans IA, sans dépendance : python3 outils/verifier_liens.py
Affiche les liens cassés (à remplacer) et ceux bloqués par le site (à vérifier à la main).
Le résultat sert de point de départ à la commande /maj-actu.
"""
import json
import pathlib
import shutil
import subprocess
import urllib.request
from concurrent.futures import ThreadPoolExecutor

RACINE = pathlib.Path(__file__).resolve().parent.parent
NAVIGATEUR = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/130 Safari/537.36"


def urls_de(objet, chemin, trouvees):
    """Parcourt un JSON et relève chaque URL avec l'endroit où elle est citée."""
    if isinstance(objet, dict):
        repere = objet.get("id") or objet.get("de") or chemin
        for cle, valeur in objet.items():
            if cle in ("source_url", "url") and isinstance(valeur, str) and valeur.startswith("http"):
                trouvees.setdefault(valeur, set()).add(f"{chemin} > {repere}")
            else:
                urls_de(valeur, chemin, trouvees)
    elif isinstance(objet, list):
        for element in objet:
            urls_de(element, chemin, trouvees)


def tester(url):
    # curl (présent sur Mac et Linux) gère les certificats du système ; sinon, Python seul
    if shutil.which("curl"):
        sortie = subprocess.run(
            ["curl", "-gsL", "-o", "/dev/null", "-m", "20", "-A", NAVIGATEUR, "-w", "%{http_code}", url],
            capture_output=True, text=True)
        code = sortie.stdout.strip()
        return url, int(code) if code.isdigit() and code != "000" else "erreur : pas de réponse"
    requete = urllib.request.Request(url, headers={"User-Agent": NAVIGATEUR, "Accept-Language": "fr"})
    try:
        with urllib.request.urlopen(requete, timeout=20) as reponse:
            return url, reponse.status
    except urllib.error.HTTPError as erreur:
        return url, erreur.code
    except Exception as erreur:  # délai dépassé, DNS, certificat...
        return url, f"erreur : {type(erreur).__name__}"


def main():
    trouvees = {}
    for fichier in sorted((RACINE / "data").glob("*.json")):
        urls_de(json.loads(fichier.read_text(encoding="utf-8")), fichier.name, trouvees)
    print(f"{len(trouvees)} sources à vérifier...\n")
    with ThreadPoolExecutor(max_workers=8) as pool:
        resultats = list(pool.map(tester, trouvees))
    casses = [(u, s) for u, s in resultats if not (isinstance(s, int) and s < 400) and s not in (401, 403, 429)]
    bloques = [(u, s) for u, s in resultats if s in (401, 403, 429)]
    for titre, liste in (("Liens cassés (à remplacer)", casses), ("Bloqués par le site (vérifier à la main)", bloques)):
        print(f"{titre} : {len(liste)}")
        for url, statut in liste:
            print(f"  [{statut}] {url}")
            for endroit in sorted(trouvees[url]):
                print(f"      cité dans {endroit}")
        print()
    print("Aucun lien cassé." if not casses else "Pensez à corriger ces sources (ou lancez /maj-actu).")


if __name__ == "__main__":
    main()
