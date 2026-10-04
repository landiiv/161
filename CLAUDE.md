# Argumentaire : PWA d'aide aux discussions

## Le projet

Application web installable (PWA) sur Android (Pixel 10), utilisée par Denis, militant antifasciste en Belgique francophone, pour répondre calmement et factuellement en discussion (famille, réseaux sociaux, repas) sur trois thèmes : violences policières, montée de l'extrême droite, recul démocratique.

Objectif principal : retrouver en moins de 10 secondes une réplique courte et le fait sourcé qui la soutient, avec un bouton pour copier le tout et le coller dans un commentaire Facebook.

Langue de l'interface et du contenu : français.

## Principes éditoriaux (non négociables)

1. Chaque fait a une source URL, une date de publication et une date de dernière vérification. Pas de source, pas de fait.
2. Chaque fait porte un niveau de fiabilité :
   - `jugé` : décision de justice définitive ou en cours (préciser l'instance)
   - `officiel` : organe public ou international (Comité P, CEDH, FRA, Défenseur des droits, V-Dem...)
   - `presse` : média reconnu
   - `associatif` : ONG ou collectif militant (ObsPol, Flagrant déni, LDH...). À afficher comme tel, jamais présenté comme officiel.
   - `analyse` : interprétation documentée mais contestée par la partie concernée, toujours accompagnée d'un avertissement (voir section Neutralité).
3. Ne jamais présenter un signalement comme un fait jugé, ni une estimation comme une statistique officielle.
4. Les affaires sans condamnation (non-lieu, acquittement) restent visibles, étiquetées clairement.
5. Aucun contenu qui appelle ou justifie la violence, contre qui que ce soit. Le ton est ferme, posé, jamais insultant.
6. Dans tout texte généré pour l'app : ne jamais utiliser le tiret long (le caractère U+2014). Utiliser virgules, deux-points ou parenthèses.
7. Citations : jamais plus d'une courte citation par source, paraphraser le reste.
8. Boycotts : la raison d'un boycott est toujours un fait vérifiable et sourcé (actionnaire, financement, décision documentée), formulé de façon neutre ("son propriétaire X finance Y, selon Z"), jamais une accusation ou un qualificatif ("marque fasciste"). Cela protège Denis contre la diffamation et rend le boycott plus convaincant. Si l'entreprise a changé de propriétaire ou pris ses distances, mettre la fiche à jour ou la retirer.

## Neutralité (règle absolue, prioritaire sur tout le reste)

Toutes les informations de l'app (faits, actus, boycotts, statistiques, résumés) sont rédigées de façon strictement neutre. L'objectif : qu'une personne en désaccord avec Denis, y compris un policier ou un électeur d'extrême droite, reconnaisse que le fait est exactement et honnêtement décrit, même si elle n'en tire pas la même conclusion.

**Vocabulaire**
- Employer les qualifications juridiques exactes : "décès", "homicide involontaire", "violences volontaires", "non-lieu", selon ce qu'a retenu la justice. Jamais "meurtre", "assassinat" ou "bavure" si ce n'est pas la qualification retenue.
- Aucun terme péjoratif ou militant : pas de "flics", "Robocops", "fachos", "nazillons", "ripoux", "terrorisme d'État", etc. Dire "policiers", "parti d'extrême droite" (terme utilisé par la science politique et la presse), "militants", etc.
- Aucun adjectif de jugement dans les titres et résumés : pas de "honteux", "scandaleux", "inadmissible", "brutal". Si un tribunal ou un organe officiel a employé un terme de ce type, l'attribuer explicitement ("le tribunal a jugé la force disproportionnée").
- Présomption d'innocence : tant qu'il n'y a pas de jugement, écrire "est poursuivi pour", "est soupçonné de", jamais "a commis".
- Pas de majuscules, points d'exclamation ou emphase pour dramatiser.

**Contenu**
- Rapporter les faits qui nuancent ou contredisent la thèse quand ils sont pertinents : acquittements, peines légères comme lourdes, version de la défense, contexte (manifestation interdite, violences préalables établies, etc.).
- Ne jamais extrapoler au-delà de la source : un chiffre sur les plaintes reste un chiffre sur les plaintes.
- Les sources associatives et militantes (ObsPol, Flagrant déni...) peuvent servir de piste, mais leur vocabulaire n'est jamais repris. Chaque fait qui en provient est reformulé neutralement et, si possible, recoupé avec une source officielle ou de presse.

**Séparer faits et opinion**
- Les faits, actus et boycotts sont neutres, sans exception.
- Les répliques (`repliques.json`) et les phrases d'ouverture du parcours expriment la position de Denis. Elles sont affichées sous une étiquette distincte, "Mon point de vue", visuellement séparée des faits. Elles restent courtoises et ne contiennent elles-mêmes aucun fait non sourcé : tout chiffre ou exemple qu'elles citent renvoie à un fait de `faits.json`.

**Analyses contestées (avec avertissement)**

Certaines réalités ne seront jamais reconnues par les personnes concernées, même quand elles sont largement documentées. Exemple : Vincent Bolloré niera toujours orienter la ligne éditoriale de ses médias. Ces informations ont leur place dans l'app, sous le niveau de fiabilité `analyse`, à condition de respecter trois règles :

1. **Reposer sur des faits établis** : l'analyse s'appuie sur au moins deux faits sourcés de `faits.json` (pour l'exemple Bolloré : rachats documentés, changements de direction, grèves de rédactions, sanctions du régulateur, auditions parlementaires... à sourcer précisément).
2. **Être attribuée** : écrire "selon des enquêtes de [médias], des journalistes de ces rédactions et [organisme]...", jamais une affirmation à la voix neutre de l'app.
3. **Mentionner la position contestée** : indiquer ce que répond la personne ou l'organisation visée ("Vincent Bolloré a nié devant la commission d'enquête du Sénat toute intervention éditoriale"), avec sa source.

Affichage : badge `analyse` distinct des faits, et un avertissement visible du type : "Interprétation largement documentée mais contestée par la personne concernée. Voir les faits sur lesquels elle repose." Le bouton "Copier" inclut cet avertissement.

**Distinguer le fait de sa qualification.** Une nomination, un lien familial, un rachat, une décision rapportés par plusieurs médias indépendants sont des faits (`presse`), même si la personne concernée ne les commente pas ou les minimise. Exemple : "X a été nommé à tel poste ; il est le beau-frère de Y (sources : RTBF, Le Soir)" est un fait. Seule la qualification ("népotisme", "favoritisme", "manipulation") relève de `analyse`, avec attribution et réponse de l'intéressé. Plusieurs médias reprenant la même dépêche Belga ou AFP comptent comme une seule source.

Ce qui reste exclu : les rumeurs, les intentions prêtées sans élément factuel, et les accusations de délit (corruption, fraude...) non jugées, qui relèvent de la diffamation.

**Test avant chaque ajout**
Avant d'enregistrer un contenu, Claude Code se pose deux questions :
- Pour un fait : "Les éléments factuels sont-ils décrits exactement, de façon que même le camp opposé ne puisse pas contester leur exactitude (seulement leur interprétation) ?" Si non, reformuler.
- Si le contenu est une interprétation que le camp opposé conteste : le classer en `analyse` et appliquer les trois règles ci-dessus.
En cas de doute, le signaler à Denis plutôt que trancher seul.

## Architecture

- PWA statique, sans backend, sans clé API dans le code client.
- HTML, CSS et JavaScript natifs (pas de framework). Un seul build optionnel avec Vite si nécessaire.
- Contenu dans `data/` en JSON, versionné dans git :
  - `data/repliques.json` : objection fréquente, réplique courte (max 280 caractères), réplique longue, ids des faits liés
  - `data/faits.json` : voir schéma ci-dessous
  - `data/boycotts.json` : voir schéma ci-dessous
  - `data/actus.json` : actualités validées, voir schéma ci-dessous
  - `data/parcours.json` : arbre de questions du mode "Besoin d'arguments ?"
  - `data/meta.json` : date de la dernière mise à jour globale
- Service worker : fonctionnement hors ligne complet, mise à jour du cache à chaque nouvelle version de `data/`.
- `manifest.webmanifest` avec icônes 192 et 512, `display: standalone`, nom court "Argumentaire".
- Hébergement : GitHub Pages (branche `main`, dossier racine). Installation sur le Pixel via Chrome, menu, "Ajouter à l'écran d'accueil".

### Schéma d'un fait

```json
{
  "id": "be-comitep-taux-2023",
  "pays": "BE",
  "theme": "police",
  "titre": "Moins de 4 % des plaintes au Comité P aboutissent à une décision judiciaire",
  "resume": "En 2023, 98 des 2557 plaintes reçues (3,83 %) ont donné lieu à une décision judiciaire à charge de policiers.",
  "fiabilite": "officiel",
  "source_url": "https://www.rtbf.be/article/en-2023-3-83-plaintes-deposees-au-comite-p-ont-abouti-a-une-condamnation-judiciaire-pourquoi-ce-chiffre-est-il-si-peu-eleve-11558415",
  "source_nom": "RTBF, d'après les rapports annuels du Comité P",
  "date_publication": "2025-06",
  "date_verification": "2026-10-04",
  "nuance": "Toutes les plaintes ne concernent pas des violences ; le Comité P n'a pas de chiffre spécifique aux violences."
}
```

Thèmes autorisés : `police`, `extreme-droite`, `democratie`, `medias` (concentration et propriété des médias), `methode` (comment argumenter).

### Schéma d'un boycott

```json
{
  "id": "marque-exemple",
  "marque": "Nom de la marque",
  "sous_marques": ["Marques du même groupe, trouvées par la recherche (optionnel)"],
  "groupe": "Groupe ou propriétaire",
  "secteur": "media | distribution | alimentation | tech | energie | autre",
  "pays": ["BE", "FR"],
  "raison": "Fait neutre et vérifiable, une ou deux phrases.",
  "nuance": "Précision utile : distributeur local différent, ancienne filiale vendue... (optionnel)",
  "faits_lies": ["id-de-fait"],
  "fiabilite": "officiel | presse | associatif | analyse",
  "source_url": "https://...",
  "source_nom": "Média ou organisme",
  "alternatives": ["Marque alternative 1", "Marque alternative 2"],
  "date_verification": "2026-10-04",
  "statut": "actif | a-revoir | retire"
}
```

Le champ `alternatives` est important : un boycott sans alternative concrète est rarement suivi.

### Schéma d'une actualité

```json
{
  "id": "2026-10-xx-titre-court",
  "date": "2026-10-04",
  "theme": "police",
  "pays": "BE",
  "titre": "Titre factuel, sans adjectif militant",
  "resume": "Trois phrases maximum, paraphrasées.",
  "pourquoi_ca_compte": "Une phrase qui relie l'actu à un argument ou à un fait existant.",
  "faits_lies": ["id-de-fait"],
  "fiabilite": "jugé | officiel | presse",
  "sources": [{ "nom": "RTBF", "url": "https://..." }]
}
```

Une actualité n'entre dans l'app que si elle est confirmée par au moins une source `officiel` ou `presse`, ou par deux sources indépendantes. Les infos uniquement militantes ou issues des réseaux sociaux restent dehors tant qu'elles ne sont pas confirmées. Une actualité importante peut ensuite être transformée en fait permanent dans `faits.json`.

### Schéma du parcours "Besoin d'arguments ?"

Arbre de décision simple, entièrement hors ligne :

```json
{
  "questions": [
    { "id": "contexte", "texte": "Tu parles avec qui ?", "options": ["Famille ou proche", "Commentaire sur les réseaux", "Débat en public", "Collègue"] },
    { "id": "theme", "texte": "Sur quel sujet ?", "options": ["Violences policières", "Extrême droite", "Médias et milliardaires", "Boycott", "On me traite d'extrémiste"] },
    { "id": "ton", "texte": "Tu veux...", "options": ["Apaiser", "Convaincre avec des faits", "Répondre court"] }
  ]
}
```

Le résultat combine les réponses pour proposer : une phrase d'ouverture adaptée au contexte, deux ou trois faits parmi les plus solides du thème (priorité `jugé` puis `officiel`), une réplique courte prête à copier, et un conseil de posture (exemple : avec un proche, commencer par ce sur quoi on est d'accord). La sélection se fait par tags et règles dans `parcours.json`, pas par IA.

## Fonctionnalités

1. **Recherche instantanée** sur objections et faits (filtrage local, pas de réseau).
2. **Mode réplique** : liste d'objections ("Vous ne montrez jamais le début", "Tu as le cerveau lavé", "La police fait juste son travail"...). Un tap affiche la réplique courte, les faits liés, et le bouton "Copier la réplique avec sources".
3. **Fiches faits** filtrables par pays (BE, FR, UE), thème et fiabilité. Badge de fiabilité bien visible. Bouton "Copier" qui produit : résumé + source + URL, en texte brut prêt à coller.
4. **Indicateur de fraîcheur** : un fait vérifié il y a plus de 6 mois est signalé "à revérifier".
5. **Favoris** stockés en localStorage.
6. **Besoin d'arguments ?** : bouton principal de l'écran d'accueil. Trois questions en un tap chacune, puis une fiche de réponse prête à l'emploi (voir schéma du parcours). C'est le point d'entrée pour les situations où Denis n'a pas le temps de chercher.
7. **Actus** : fil chronologique des actualités validées, filtrable par thème et pays, chaque entrée liée aux faits concernés. Pastille "nouveau" sur les actus ajoutées depuis la dernière ouverture.
8. **Boycotts** : liste par secteur avec recherche par nom de marque (cas d'usage : Denis est au magasin et vérifie une marque). Chaque fiche affiche la raison, la source, les alternatives et la date de vérification. Les fiches `a-revoir` sont signalées, les `retire` sont masquées.
9. Navigation basse à 4 onglets : Arguments, Faits, Actus, Boycotts.
10. Aucune collecte de données, aucun tracker, aucune police ou ressource chargée depuis un tiers à l'exécution (polices auto-hébergées).

## Mise à jour du contenu avec l'actualité

Pas d'appel automatique à une IA depuis l'app. La mise à jour se fait par Denis via Claude Code, avec validation humaine :

Quand Denis demande "mise à jour actu" (ou lance `/maj-actu`) :
1. Lire `data/faits.json` et lister les faits dont `date_verification` a plus de 3 mois, ainsi que les procès annoncés (Zecler, Chouviat, Nahel...).
2. Faire des recherches web ciblées pour chacun : nouveau jugement, appel, chiffre plus récent, rapport annuel publié (Comité P, IGPN, V-Dem, FRA).
3. Chercher aussi les nouvelles décisions de justice importantes en Belgique et en France sur les violences policières depuis `meta.json`.
3 bis. Proposer 3 à 8 actualités validées depuis la dernière mise à jour, sur les thèmes de l'app, selon la règle de confirmation des actus.
3 ter. Pour chaque boycott dont la vérification a plus de 3 mois : vérifier que le propriétaire et la raison sont toujours d'actualité (rachat, revente, prise de distance). Proposer `a-revoir` ou `retire` si besoin.
4. Relire chaque proposition avec le test de neutralité (section Neutralité) et reformuler si besoin. Présenter à Denis un tableau des changements proposés (ajout, modification, fait à retirer), chacun avec sa source. Ne rien écrire dans `data/` avant son accord explicite.
5. Après accord : modifier le JSON, mettre à jour les dates, incrémenter la version du service worker, committer avec un message clair, pousser.

Créer la commande `.claude/commands/maj-actu.md` qui reprend ces étapes.

## Design

L'app doit inspirer confiance à quelqu'un qui n'est pas d'accord avec Denis : sobre, lisible, sérieuse. L'esthétique d'un carnet de terrain d'enquêteur plutôt qu'une affiche militante.

- Pas de fond crème avec accent terracotta, pas de noir avec accent vert acide, pas de cartes arrondies identiques avec ombre grise, pas de libellés en majuscules espacées.
- Les badges de fiabilité sont le seul élément coloré fort, avec un code couleur distinct et lisible (et un texte, jamais la couleur seule).
- Une seule famille typographique lisible sur petit écran, auto-hébergée, avec une échelle claire.
- Mobile d'abord (largeur 360 à 430 px), mode sombre automatique, contraste AA, cibles tactiles de 44 px minimum, mouvement réduit respecté.
- Textes de l'interface : verbes simples, phrases courtes, sans jargon.

## Contenu initial à intégrer

Créer les entrées suivantes (vérifier chaque URL avant de l'enregistrer) :

**Répliques**
- "Je ne suis pas contre la police, je suis contre une police qui n'a plus de comptes à rendre. L'histoire montre que c'est souvent par là que commencent les dérives autoritaires."
- "Je défends l'État de droit, y compris face à ceux qui sont censés le faire respecter."
- Réponse à "On ne voit jamais le début" : les affaires citées ont été établies par des tribunaux qui ont vu toutes les images et entendu les policiers.

**Faits (police)**
- Théo Luhaka (FR, jugé) : 3 policiers condamnés en 2024, IGPN : usage disproportionné de la force. https://www.france24.com/fr/info-en-continu/20240119-%F0%9F%94%B4-affaire-th%C3%A9o-les-trois-policiers-condamn%C3%A9s-%C3%A0-des-peines-de-3-%C3%A0-12-mois-de-prison-avec-sursis
- Geneviève Legay (FR, jugé) : commissaire condamné, charge jugée ni justifiée ni proportionnée, confirmé en appel. https://www.lyoncapitale.fr/?p=507748
- Liège 2023 (BE, jugé) : 5 policiers condamnés pour coups de matraque injustifiés. https://www.rtbf.be/article/cinq-policiers-condamnes-au-tribunal-correctionnel-de-liege-apres-une-scene-de-coups-injustifies-11205885
- Saint-Gilles 2016 (BE, jugé) : 4 policiers condamnés pour coups et traitement dégradant. https://www.rtbf.be/article/a-bruxelles-cinq-policiers-condamnes-pour-violence-et-traitement-degradant-sur-trois-jeunes-hommes-11001291
- Mawda (BE, jugé) : policier condamné en appel, absence de proportionnalité. https://www.rtbf.be/article/deces-de-la-petite-mawda-la-cour-d-appel-reduit-la-peine-du-policier-10872867
- Bouyid c. Belgique (BE, jugé, CEDH 2015) : une gifle policière est un traitement dégradant. https://www.liguedh.be/wp-content/uploads/2018/06/Analyse_LDH_2015_Bouyid_c_Belgique.pdf
- Nasses du 24 janvier 2021 (BE, jugé, civil) : État, zone de police et bourgmestre condamnés. https://www.lavenir.net/regions/bruxelles/2025/03/17/violences-policieres-lors-dune-manif-letat-belge-la-zone-de-police-bruxelles-capitaleixelles-et-le-bourgmestre-de-bruxelles-condamnes-LU5F5JGL7FA7PMXMDTWLIETPII/
- Chovanec (BE, non-lieu en appel 2026) : étiqueter "sans condamnation". https://www.rtbf.be/article/affaire-chovanec-la-cour-d-appel-de-mons-prononce-un-non-lieu-pour-les-31-inculpes-11695295
- Procès à suivre : Zecler (novembre 2026), Chouviat (octobre 2026), Nahel (cassation 2026).

**Faits (statistiques)**
- Comité P : 2,08 % (2021), 3,27 % (2022), 3,83 % (2023) des plaintes aboutissent à une décision judiciaire (schéma ci-dessus).
- France, Flagrant déni d'après le ministère de la Justice (associatif) : 74 % des policiers mis en cause pour violences jugés "non poursuivables" en 2021, contre 33 % pour les violences en général. https://www.flagrant-deni.fr/violences-policieres-la-justice-blanchit-mais-cache-son-chiffre-noir/
- FRA, EU-MIDIS II (officiel) : 63 % des victimes d'agression raciste par un policier ne la signalent pas. https://fra.europa.eu/sites/default/files/fra_uploads/fra-2019-being-black-in-the-eu-summary_en.pdf
- Estimation (fiabilité `methode`, à afficher comme telle) : en croisant Comité P et FRA, environ 1 % des situations vécues comme violences policières arrivent devant un juge. Ordre de grandeur, pas une statistique officielle.

**Boycotts** : aucun contenu initial. Lors de la première session, demander à Denis quelles marques il vise, puis rechercher pour chacune la raison factuelle et une source solide avant de créer la fiche. Ne jamais ajouter une marque sur la seule base d'une rumeur ou d'un post viral.

**À sourcer lors de la première mise à jour** : rapport V-Dem le plus récent (recul démocratique), origines du parti Fratelli d'Italia (MSI), résultats du Vlaams Belang en 2024.

## Méthode de travail

- Commencer par la structure des données et le contenu initial, puis l'interface, puis le service worker.
- Tester sur un viewport de 390 px et en mode hors ligne avant chaque commit.
- Garder le code simple et commenté en français : Denis doit pouvoir modifier un JSON à la main sans casser l'app.
