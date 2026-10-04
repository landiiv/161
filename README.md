# Argumentaire

Application web installable sur téléphone (PWA) pour répondre calmement et avec des faits sourcés dans une discussion, en famille, au travail ou sur les réseaux sociaux. Elle couvre les violences policières, l'extrême droite, le recul démocratique, la propriété des médias et les boycotts.

**Ouvrir l'app : https://landiiv.github.io/161/**

Elle fonctionne hors ligne, ne collecte aucune donnée, n'a ni publicité ni traceur, et ne charge rien depuis un site tiers.

## Ce qu'on y trouve

| Onglet | Contenu |
|---|---|
| **Arguments** | Objections fréquentes et répliques courtes, prêtes à copier avec leurs sources. Le bouton « Besoin d'arguments ? » propose une réponse en trois questions. |
| **Faits** | Fiches sourcées, avec un niveau de fiabilité visible : jugé, officiel, presse, associatif, analyse contestée, estimation. |
| **Actus** | Actualités vérifiées, reliées aux faits. |
| **Boycotts** | Marques et entreprises, avec la raison factuelle, la source, un niveau d'impact et des alternatives. |
| **Réseaux** | Toile des liens (famille, propriété, direction, financement) entre grandes fortunes, entreprises, médias et responsables politiques, en France et en Belgique. |

Chaque onglet a une recherche et des filtres à cocher.

## Principes

- **Pas de source, pas de fait.** Chaque fiche indique sa source, sa date et sa date de dernière vérification. Une fiche vérifiée il y a plus de six mois est signalée « à revérifier ».
- **Neutralité des faits.** Les faits sont décrits de façon qu'une personne en désaccord puisse en reconnaître l'exactitude, même si elle n'en tire pas la même conclusion. Ils utilisent la qualification juridique exacte et respectent la présomption d'innocence. Les affaires sans condamnation restent visibles.
- **Faits et opinions séparés.** Les répliques expriment le point de vue de l'auteur, sous l'étiquette « Mon point de vue ».
- **Les sources associatives sont étiquetées comme telles.** Les interprétations contestées sont marquées « analyse », avec la réponse de la personne visée.
- **Boycotts.** La raison est toujours un fait vérifiable (actionnaire, don déclaré, décision documentée), jamais un qualificatif. Le niveau d'impact dit à quel point le lien est direct :
  - **fort** : l'entreprise mène elle-même l'activité en cause ;
  - **moyen** : le lien passe par un actionnaire, une filiale ou un franchisé ;
  - **faible** : don ponctuel ou prise de position.

  Pour la base de données de l'ONU, ces niveaux reprennent la classification du Haut-Commissariat aux droits de l'homme.

## Signaler une erreur ou proposer un ajout

Chaque fiche a un bouton **Signaler une erreur**, et chaque onglet un lien **Proposer une correction ou un ajout**. Ils ouvrent un [ticket GitHub](https://github.com/landiiv/161/issues) prérempli (il faut un compte GitHub). Merci de joindre une source : sans source vérifiable, rien n'est ajouté.

## Installer sur un téléphone Android

Ouvrir l'adresse dans Chrome, puis menu ⋮ et **Ajouter à l'écran d'accueil**. L'app fonctionne ensuite sans connexion et se met à jour toute seule quand elle en trouve une.

## Fonctionnement technique

- HTML, CSS et JavaScript natifs, sans framework ni étape de compilation.
- Tout le contenu est dans `data/*.json`, modifiable à la main :

| Fichier | Contenu |
|---|---|
| `faits.json` | faits sourcés |
| `repliques.json` | objections et répliques |
| `actus.json` | actualités |
| `boycotts.json` | fiches boycott |
| `reseaux.json` | entités et liens de l'onglet Réseaux |
| `parcours.json` | questions du parcours « Besoin d'arguments ? » |
| `meta.json` | version, date de mise à jour, sujets à suivre, adresse de signalement |

- `sw.js` gère le hors-ligne. Après chaque modification, il faut augmenter `VERSION` dans `sw.js`, sinon les téléphones gardent l'ancienne version.
- Hébergement gratuit sur GitHub Pages : chaque `git push` sur `main` met le site à jour.

## Mise à jour du contenu

La mise à jour est manuelle et gratuite :

1. `python3 outils/verifier_liens.py` vérifie que toutes les sources répondent encore. Il n'utilise pas d'IA.
2. Dans Claude Code, la commande `/maj-actu` recherche les nouveaux jugements, les chiffres plus récents, les changements de propriétaires et les signalements reçus. Elle propose ensuite un tableau de changements, chacun avec sa source. Rien n'est écrit sans validation humaine.

Les règles éditoriales complètes sont dans [`CLAUDE.md`](CLAUDE.md).
