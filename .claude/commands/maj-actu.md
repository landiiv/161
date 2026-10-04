---
description: Mettre à jour les faits, actus et boycotts avec l'actualité (validation humaine obligatoire)
---

Mise à jour du contenu de l'app Argumentaire. Respecter strictement les sections « Principes éditoriaux » et « Neutralité » de CLAUDE.md.

0. Lancer `python3 outils/verifier_liens.py` (gratuit, sans IA) : il liste les sources cassées ou bloquées dans tous les fichiers de `data/`. Les traiter en priorité.
1. Lire `data/faits.json` et lister les faits dont `date_verification` a plus de 3 mois, ainsi que les éléments de `data/meta.json` > `a_suivre` (procès annoncés : Zecler, Chouviat, Nahel...).
2. Faire des recherches web ciblées pour chacun : nouveau jugement, appel, chiffre plus récent, rapport annuel publié (Comité P, IGPN, V-Dem, FRA).
3. Chercher les nouvelles décisions de justice importantes en Belgique et en France sur les violences policières depuis `derniere_maj` de `data/meta.json`.
4. Proposer 3 à 8 actualités validées depuis la dernière mise à jour, sur les thèmes de l'app. Une actu n'entre que si elle est confirmée par au moins une source `officiel` ou `presse`, ou par deux sources indépendantes (plusieurs médias reprenant la même dépêche Belga ou AFP = une seule source).
4 bis. En septembre : vérifier la mise à jour annuelle de la base de données du HCDH (ONU) sur les entreprises liées aux colonies, et mettre à jour les fiches `israel-palestine` (ajouts, retraits, type d'implication).
4 ter. Pour `data/reseaux.json` : vérifier les liens dont `date_verification` a plus de 6 mois (rachats, cessions, changements de dirigeants) ; marquer `fin` (année) sur un lien terminé plutôt que de le supprimer.
5. Pour chaque boycott de `data/boycotts.json` dont la vérification a plus de 3 mois : vérifier que le propriétaire et la raison sont toujours d'actualité (rachat, revente, prise de distance). Proposer `a-revoir` ou `retire` si besoin.
6. Vérifier chaque URL (elle doit répondre) avant de la proposer. Relire aussi les tickets GitHub ouverts via le bouton « Signaler une erreur » (`gh issue list`) : chaque signalement est une piste, jamais une source.
7. Relire chaque proposition avec le test de neutralité :
   - Les éléments factuels sont-ils décrits de façon que même le camp opposé ne puisse pas contester leur exactitude ?
   - Si c'est une interprétation contestée : niveau `analyse`, attribution, réponse de la personne visée.
   - Qualification juridique exacte, présomption d'innocence, aucun adjectif de jugement, aucun tiret long (U+2014).
8. Présenter à Denis un tableau des changements proposés (ajout, modification, retrait), chacun avec sa source. **Ne rien écrire dans `data/` avant son accord explicite.** En cas de doute sur un contenu, le signaler plutôt que trancher.
9. Après accord :
   - modifier les JSON et mettre à jour les dates (`date_verification`, `meta.json` > `derniere_maj` et `version`) ;
   - incrémenter `VERSION` dans `sw.js` (même valeur que `meta.json` > `version`) ;
   - vérifier que les JSON sont valides (`python3 -m json.tool data/*.json`) et qu'aucun tiret long n'apparaît (`grep -r $'\u2014' data/`) ;
   - committer avec un message clair, puis pousser.
