// Argumentaire : logique de l'app (JavaScript natif, sans framework).
// Le contenu vient des fichiers data/*.json ; ce fichier ne fait que l'afficher.
'use strict';

const etat = { faits: [], repliques: [], actus: [], boycotts: [], parcours: null, meta: {}, reseaux: null };
const favoris = new Set(lire('favoris', []));
let reponsesParcours = [];

// Libellés affichés pour chaque niveau de fiabilité (texte + couleur, jamais la couleur seule)
const FIABILITE = {
  'jugé': { label: 'Jugé', classe: 'b-juge' },
  officiel: { label: 'Officiel', classe: 'b-officiel' },
  presse: { label: 'Presse', classe: 'b-presse' },
  associatif: { label: 'Associatif', classe: 'b-asso' },
  analyse: { label: 'Analyse contestée', classe: 'b-analyse' },
  methode: { label: 'Estimation', classe: 'b-methode' }
};
const AVERTISSEMENT_ANALYSE = 'Interprétation largement documentée mais contestée par la personne concernée. Voir les faits sur lesquels elle repose.';
const PAYS = { BE: 'Belgique', FR: 'France', UE: 'Union européenne', US: 'États-Unis', INT: 'International' };
const THEMES = { police: 'Police', 'extreme-droite': 'Extrême droite', democratie: 'Démocratie', medias: 'Médias', methode: 'Méthode', 'israel-palestine': 'Israël-Palestine' };
const CATEGORIES = { bollore: 'Groupe Bolloré', 'extreme-droite': 'Extrême droite', trump: 'Investiture de Trump', 'israel-palestine': 'Israël-Palestine' };
const IMPACT = { fort: 'fort', moyen: 'moyen', faible: 'faible' };
const SECTEURS = { media: 'Médias', distribution: 'Distribution', alimentation: 'Alimentation', tech: 'Tech', energie: 'Énergie', autre: 'Autre' };
const SIX_MOIS = 182 * 24 * 3600 * 1000;

/* ---------- Outils ---------- */

function lire(cle, defaut) {
  try { return JSON.parse(localStorage.getItem(cle)) ?? defaut; } catch { return defaut; }
}
function ecrire(cle, valeur) {
  try { localStorage.setItem(cle, JSON.stringify(valeur)); } catch { /* stockage indisponible */ }
}
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
// Minuscules sans accents, pour la recherche
function norm(s) {
  return String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}
function dateFr(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric' });
}
function aRevérifier(iso) {
  const d = new Date(iso);
  return isNaN(d) || Date.now() - d.getTime() > SIX_MOIS;
}
const faitParId = (id) => etat.faits.find((f) => f.id === id);
const repliqueParId = (id) => etat.repliques.find((r) => r.id === id);

function badge(fiab) {
  const b = FIABILITE[fiab] || { label: fiab, classe: 'b-methode' };
  return `<span class="badge ${b.classe}">${esc(b.label)}</span>`;
}

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('visible');
  clearTimeout(toast.minuterie);
  toast.minuterie = setTimeout(() => t.classList.remove('visible'), 1800);
}

async function copier(texte) {
  try {
    await navigator.clipboard.writeText(texte);
  } catch {
    // Secours pour les navigateurs sans accès au presse-papiers
    const zone = document.createElement('textarea');
    zone.value = texte;
    document.body.appendChild(zone);
    zone.select();
    document.execCommand('copy');
    zone.remove();
  }
  toast('Copié');
}

/* ---------- Signaler une erreur ou proposer un ajout ----------
   Ouvre un ticket GitHub prérempli (ou un courriel si une adresse est
   renseignée dans data/meta.json > signalement). L'app ne collecte rien elle-même. */

function urlSignalement(sujet, corps) {
  const s = etat.meta.signalement || {};
  if (s.github_issues) return `${s.github_issues}?title=${encodeURIComponent(sujet)}&body=${encodeURIComponent(corps)}`;
  if (s.email) return `mailto:${s.email}?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(corps)}`;
  return '';
}
function boutonSignaler(onglet, titre, id) {
  const url = urlSignalement(`Erreur : ${titre}`,
    `Onglet : ${onglet}\nÉlément : « ${titre} » (id : ${id})\n\nQuel est le problème ?\n\n\nSource qui le montre (lien obligatoire) :\n`);
  return url ? `<a class="bouton" href="${esc(url)}" target="_blank" rel="noopener">Signaler une erreur</a>` : '';
}
function piedSignalement() {
  const url = urlSignalement('Proposition d\'ajout', 'Ce que je propose d\'ajouter ou de corriger :\n\n\nSource (lien obligatoire, de préférence presse reconnue ou source officielle) :\n');
  return url ? `<p class="signaler-global">Une erreur, une information à ajouter ? <a href="${esc(url)}" target="_blank" rel="noopener">Proposer une correction ou un ajout</a>. Sans source vérifiable, rien n'est ajouté.</p>` : '';
}

/* ---------- Textes copiés (texte brut, prêt à coller sur Facebook) ---------- */

function texteFait(f) {
  let t = `${f.resume}\nSource : ${f.source_nom} (${f.date_publication}). ${f.source_url}`;
  if (f.fiabilite === 'associatif') t += '\n(Source associative.)';
  if (f.fiabilite === 'methode') t += '\n(Estimation, pas une statistique officielle.)';
  if (f.fiabilite === 'analyse') t += '\n' + AVERTISSEMENT_ANALYSE;
  if (f.nuance) t += `\nNuance : ${f.nuance}`;
  return t;
}
function texteBoycott(b) {
  let t = `${b.marque} (${b.groupe})${b.motif ? ', motif : ' + b.motif : ''}.\n${b.raison}\nSource : ${b.source_nom}. ${b.source_url}`;
  if (b.fiabilite === 'analyse') t += '\n' + AVERTISSEMENT_ANALYSE;
  if (b.nuance) t += `\nNuance : ${b.nuance}`;
  if ((b.alternatives || []).length) t += `\nAlternatives : ${b.alternatives.join(', ')}`;
  return t;
}
function texteReplique(r) {
  const sources = (r.faits_lies || []).map(faitParId).filter(Boolean)
    .map((f) => `- ${f.titre} (${f.source_nom}) ${f.source_url}` + (f.fiabilite === 'analyse' ? `\n  ${AVERTISSEMENT_ANALYSE}` : ''));
  return r.courte + (sources.length ? '\n\nSources :\n' + sources.join('\n') : '');
}

/* ---------- Composants ---------- */

function carteFait(f) {
  const fav = favoris.has(f.id);
  const perime = aRevérifier(f.date_verification);
  const issue = f.issue === 'sans-condamnation' ? '<span class="issue">Sans condamnation</span>' : '';
  return `<article class="fiche" id="fait-${esc(f.id)}">
    <div class="tete">${badge(f.fiabilite)}${issue}<span>${esc(PAYS[f.pays] || f.pays)} · ${esc(THEMES[f.theme] || f.theme)}</span></div>
    <h3>${esc(f.titre)}</h3>
    <p>${esc(f.resume)}</p>
    ${f.fiabilite === 'analyse' ? `<p class="avert">${AVERTISSEMENT_ANALYSE}</p>` : ''}
    ${f.nuance ? `<p class="nuance"><strong>Nuance :</strong> ${esc(f.nuance)}</p>` : ''}
    <p class="source">Source : <a href="${esc(f.source_url)}" target="_blank" rel="noopener">${esc(f.source_nom)}</a>, ${esc(f.date_publication)}</p>
    <p class="verif${perime ? ' perime' : ''}">${perime ? 'À revérifier. ' : ''}Vérifié le ${esc(dateFr(f.date_verification))}</p>
    <div class="actions">
      <button type="button" data-copier-fait="${esc(f.id)}">Copier</button>
      <button type="button" data-fav="${esc(f.id)}" aria-pressed="${fav}">${fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}</button>
      ${boutonSignaler('Faits', f.titre, f.id)}
    </div>
  </article>`;
}

function listeFaitsLies(ids) {
  const faits = (ids || []).map(faitParId).filter(Boolean);
  if (!faits.length) return '';
  return `<p class="etiquette-avis">Faits liés</p><ul class="faits-lies">${faits.map((f) =>
    `<li>${badge(f.fiabilite)}${f.issue === 'sans-condamnation' ? ' <span class="issue">Sans condamnation</span>' : ''} ${esc(f.titre)}. <a href="${esc(f.source_url)}" target="_blank" rel="noopener">${esc(f.source_nom)}</a></li>`
  ).join('')}</ul>`;
}

function blocReplique(r, ouvert) {
  return `<details class="objection"${ouvert ? ' open' : ''}>
    <summary>« ${esc(r.objection)} »</summary>
    <div class="corps">
      <div class="avis">
        <p class="etiquette-avis">Mon point de vue</p>
        <p>${esc(r.courte)}</p>
        ${r.longue ? `<details><summary>Version longue</summary><p>${esc(r.longue)}</p></details>` : ''}
      </div>
      ${listeFaitsLies(r.faits_lies)}
      <div class="actions"><button type="button" class="principal" data-copier-replique="${esc(r.id)}">Copier la réplique avec sources</button></div>
    </div>
  </details>`;
}

/* ---------- Filtres à cocher ----------
   Chaque onglet propose des catégories à cocher / décocher.
   Par défaut tout est coché : on ne mémorise que ce qui est décoché,
   ainsi une nouvelle catégorie ajoutée dans les JSON apparaît cochée. */

// Valeurs présentes dans les données, dans l'ordre voulu, avec leur libellé
function optionsDe(listes, cle, libelles, ordre) {
  const vals = [...new Set(listes.flat().flatMap((x) => [].concat(x[cle] ?? [])))];
  if (ordre) vals.sort((a, b) => ordre.indexOf(a) - ordre.indexOf(b));
  return vals.map((v) => [v, libelles[v] || v]);
}

function blocFiltres(page, groupes) {
  const off = lire('decoches-' + page, {});
  const html = groupes.filter((g) => g.options.length > 1).map((g) => `
    <fieldset><legend>${esc(g.titre)}</legend>${g.options.map(([v, l]) => `
      <label class="chip"><input type="checkbox" data-groupe="${esc(g.cle)}" value="${esc(v)}"${(off[g.cle] || []).includes(v) ? '' : ' checked'}> ${esc(l)}</label>`).join('')}
    </fieldset>`).join('');
  return html ? `<details class="filtres-chips" id="filtres"><summary>${resumeFiltres(off)}</summary>${html}
    <button type="button" class="lien" data-tout-cocher>Tout cocher</button></details>` : '';
}

function resumeFiltres(off) {
  const n = Object.values(off).reduce((s, l) => s + l.length, 0);
  return n ? `Filtrer (${n} catégorie${n > 1 ? 's' : ''} masquée${n > 1 ? 's' : ''})` : 'Filtrer par catégorie';
}

// Branche les cases d'un onglet ; appelle redessiner() à chaque changement
function brancherFiltres(page, redessiner) {
  const bloc = document.getElementById('filtres');
  if (!bloc) return;
  const maj = () => {
    const off = {};
    bloc.querySelectorAll('input[data-groupe]').forEach((c) => { if (!c.checked) (off[c.dataset.groupe] ||= []).push(c.value); });
    ecrire('decoches-' + page, off);
    bloc.querySelector('summary').textContent = resumeFiltres(off);
    redessiner();
  };
  bloc.addEventListener('change', maj);
  bloc.querySelector('[data-tout-cocher]').addEventListener('click', () => {
    bloc.querySelectorAll('input[data-groupe]').forEach((c) => { c.checked = true; });
    maj();
  });
}

// Un élément passe si sa valeur (ou l'une de ses valeurs) n'est pas décochée
function passe(page, item, cles) {
  const off = lire('decoches-' + page, {});
  return cles.every((cle) => {
    const masques = off[cle] || [];
    const vals = [].concat(item[cle] ?? []);
    return !vals.length || vals.some((v) => !masques.includes(v));
  });
}

/* ---------- Vues ---------- */

const vue = () => document.getElementById('vue');

function vueArguments() {
  const groupes = [{ cle: 'theme', titre: 'Thème', options: optionsDe([etat.repliques, etat.faits], 'theme', THEMES) }];
  vue().innerHTML = `
    <a class="bouton principal gros" href="#parcours">Besoin d'arguments ?<small>Trois questions, une réponse prête à copier</small></a>
    <label for="recherche" class="etiquette-avis">Chercher une objection ou un fait</label>
    <input id="recherche" type="search" placeholder="Ex. : début, plainte, Mawda" autocomplete="off">
    ${blocFiltres('arguments', groupes)}
    <div id="resultats"></div>`;
  const champ = document.getElementById('recherche');
  const dessiner = () => {
    const q = norm(champ.value.trim());
    const reps = etat.repliques.filter((r) => passe('arguments', r, ['theme']) &&
      (!q || norm(r.objection + ' ' + r.courte + ' ' + r.longue).includes(q)));
    const faits = q ? etat.faits.filter((f) => passe('arguments', f, ['theme']) &&
      norm(f.titre + ' ' + f.resume + ' ' + f.source_nom).includes(q)) : [];
    document.getElementById('resultats').innerHTML =
      `<h2 class="section-titre">On me dit...</h2>` +
      (reps.length ? reps.map((r) => blocReplique(r, false)).join('') : '<p class="vide">Aucune objection trouvée.</p>') +
      (q ? `<h2 class="section-titre">Faits</h2>` + (faits.length ? faits.map(carteFait).join('') : '<p class="vide">Aucun fait trouvé.</p>') : '');
  };
  champ.addEventListener('input', dessiner);
  brancherFiltres('arguments', dessiner);
  dessiner();
}

function vueFaits() {
  const fiabs = Object.fromEntries(Object.entries(FIABILITE).map(([k, v]) => [k, v.label]));
  const groupes = [
    { cle: 'theme', titre: 'Thème', options: optionsDe([etat.faits], 'theme', THEMES) },
    { cle: 'pays', titre: 'Pays', options: optionsDe([etat.faits], 'pays', PAYS) },
    { cle: 'fiabilite', titre: 'Fiabilité', options: optionsDe([etat.faits], 'fiabilite', fiabs, Object.keys(FIABILITE)) }
  ];
  const fav = lire('faits-favoris-seuls', false);
  vue().innerHTML = `
    <h2>Faits</h2>
    <label for="recherche" class="etiquette-avis">Chercher un fait</label>
    <input id="recherche" type="search" placeholder="Ex. : Comité P, CEDH, Bolloré" autocomplete="off">
    ${blocFiltres('faits', groupes)}
    <label class="case"><input type="checkbox" id="fav"${fav ? ' checked' : ''}> Mes favoris seulement</label>
    <div id="liste"></div>`;
  const champ = document.getElementById('recherche');
  const caseFav = document.getElementById('fav');
  const dessiner = () => {
    const q = norm(champ.value.trim());
    ecrire('faits-favoris-seuls', caseFav.checked);
    const liste = etat.faits.filter((x) => passe('faits', x, ['theme', 'pays', 'fiabilite']) &&
      (!caseFav.checked || favoris.has(x.id)) &&
      (!q || norm(x.titre + ' ' + x.resume + ' ' + x.source_nom).includes(q)));
    document.getElementById('liste').innerHTML = liste.length ? liste.map(carteFait).join('') : '<p class="vide">Aucun fait pour ces filtres.</p>';
  };
  champ.addEventListener('input', dessiner);
  caseFav.addEventListener('change', dessiner);
  brancherFiltres('faits', dessiner);
  dessiner();
}

function vueActus() {
  const vus = new Set(lire('actus-vues', []));
  const groupes = [
    { cle: 'theme', titre: 'Thème', options: optionsDe([etat.actus], 'theme', THEMES) },
    { cle: 'pays', titre: 'Pays', options: optionsDe([etat.actus], 'pays', PAYS) }
  ];
  vue().innerHTML = `
    <h2>Actus</h2>
    <label for="recherche" class="etiquette-avis">Chercher une actu</label>
    <input id="recherche" type="search" placeholder="Ex. : appel, non-lieu" autocomplete="off">
    ${blocFiltres('actus', groupes)}
    <div id="liste"></div>`;
  const champ = document.getElementById('recherche');
  const dessiner = () => {
    const q = norm(champ.value.trim());
    const liste = etat.actus
      .filter((a) => passe('actus', a, ['theme', 'pays']) && (!q || norm(a.titre + ' ' + a.resume).includes(q)))
      .sort((a, b) => b.date.localeCompare(a.date));
    document.getElementById('liste').innerHTML = liste.length ? liste.map((a) => `
      <article class="fiche">
        <div class="tete">${badge(a.fiabilite)}<span>${esc(dateFr(a.date))} · ${esc(PAYS[a.pays] || a.pays)}</span>${vus.has(a.id) ? '' : '<span class="nouveau">Nouveau</span>'}</div>
        <h3>${esc(a.titre)}</h3>
        <p>${esc(a.resume)}</p>
        <p class="nuance"><strong>Pourquoi ça compte :</strong> ${esc(a.pourquoi_ca_compte)}</p>
        <p class="source">Sources : ${(a.sources || []).map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.nom)}</a>`).join(', ')}</p>
        ${(a.faits_lies || []).map(faitParId).filter(Boolean).map((x) => `<p class="source">Fait lié : <a href="#faits" data-voir-fait="${esc(x.id)}">${esc(x.titre)}</a></p>`).join('')}
        <div class="actions">${boutonSignaler('Actus', a.titre, a.id)}</div>
      </article>`).join('') : '<p class="vide">Aucune actu pour ces filtres.</p>';
  };
  champ.addEventListener('input', dessiner);
  brancherFiltres('actus', dessiner);
  dessiner();
  // Les actus affichées ne sont plus « nouvelles » à la prochaine ouverture
  ecrire('actus-vues', etat.actus.map((a) => a.id));
  majPastille();
}

function vueBoycotts() {
  const actives = etat.boycotts.filter((b) => b.statut !== 'retire');
  const groupes = [
    { cle: 'categorie', titre: 'Catégorie', options: optionsDe([actives], 'categorie', CATEGORIES, Object.keys(CATEGORIES)) },
    { cle: 'impact', titre: 'Impact', options: optionsDe([actives], 'impact', IMPACT, Object.keys(IMPACT)) },
    { cle: 'secteur', titre: 'Secteur', options: optionsDe([actives], 'secteur', SECTEURS, Object.keys(SECTEURS)) }
  ];
  vue().innerHTML = `
    <h2>Boycotts</h2>
    <label for="marque" class="etiquette-avis">Chercher une marque</label>
    <input id="marque" type="search" placeholder="Nom de la marque ou du groupe" autocomplete="off">
    ${blocFiltres('boycotts', groupes)}
    <details class="legende"><summary>Comment lire l'impact ?</summary>
      <p><strong>Fort :</strong> l'entreprise elle-même (ou son propriétaire quasi unique) mène l'activité en cause. Pour la base de l'ONU : implication par « causalité » ou « contribution ».</p>
      <p><strong>Moyen :</strong> lien par un actionnaire, une maison mère, une filiale, un franchisé ou un partenaire. Pour la base de l'ONU : « lien direct ».</p>
      <p><strong>Faible :</strong> don ponctuel et légal, don personnel d'un dirigeant ou prise de position publique.</p>
      <p>L'impact mesure à quel point le lien est direct, pas la gravité des faits. La fiabilité (badge de couleur) dit d'où vient l'information.</p>
    </details>
    <div id="liste"></div>`;
  const champ = document.getElementById('marque');
  const pre = lire('boycott-recherche', '');
  if (pre) { champ.value = pre; ecrire('boycott-recherche', ''); }
  const ordreImpact = Object.keys(IMPACT);
  const dessiner = () => {
    const q = norm(champ.value.trim());
    // La recherche porte aussi sur les sous-marques (ex. « Fayard » trouve Hachette Livre)
    const liste = actives.filter((b) => passe('boycotts', b, ['categorie', 'impact', 'secteur']) &&
      (!q || norm([b.marque, b.groupe, b.motif, ...(b.sous_marques || [])].join(' ')).includes(q)))
      .sort((a, b) => ordreImpact.indexOf(a.impact) - ordreImpact.indexOf(b.impact));
    if (!etat.boycotts.length) {
      document.getElementById('liste').innerHTML = '<p class="vide">Aucune fiche pour l\'instant. Chaque marque est ajoutée seulement après vérification d\'une source solide.</p>';
      return;
    }
    if (!liste.length) {
      document.getElementById('liste').innerHTML = q
        ? '<p class="vide">Pas de fiche pour cette marque (ou elle est masquée par les filtres).</p>'
        : '<p class="vide">Aucune fiche pour ces filtres.</p>';
      return;
    }
    const parSecteur = {};
    liste.forEach((b) => (parSecteur[b.secteur] ||= []).push(b));
    document.getElementById('liste').innerHTML = Object.entries(parSecteur).map(([s, l]) =>
      `<h3 class="section-titre">${esc(SECTEURS[s] || s)}</h3>` + l.map((b) => `
        <article class="fiche">
          <div class="tete">${badge(b.fiabilite)}${b.impact ? `<span class="issue">Impact ${esc(IMPACT[b.impact] || b.impact)}</span>` : ''}${b.statut === 'a-revoir' ? '<span class="issue">À revoir</span>' : ''}<span>${esc(CATEGORIES[b.categorie] || '')}</span></div>
          <h3>${esc(b.marque)}</h3>
          ${b.motif ? `<p class="source">Motif : <strong>${esc(b.motif)}</strong></p>` : ''}
          <p class="source">Groupe : ${esc(b.groupe)}</p>
          ${(b.sous_marques || []).length ? `<p class="source">Marques concernées : ${esc(b.sous_marques.join(', '))}</p>` : ''}
          <p>${esc(b.raison)}</p>
          ${b.fiabilite === 'analyse' ? `<p class="avert">${AVERTISSEMENT_ANALYSE}</p>` : ''}
          ${b.nuance ? `<p class="nuance"><strong>Nuance :</strong> ${esc(b.nuance)}</p>` : ''}
          ${(b.alternatives || []).length ? `<p><strong>Alternatives :</strong> ${esc(b.alternatives.join(', '))}</p>` : ''}
          <p class="source">Source : <a href="${esc(b.source_url)}" target="_blank" rel="noopener">${esc(b.source_nom)}</a></p>
          <p class="verif${aRevérifier(b.date_verification) ? ' perime' : ''}">Vérifié le ${esc(dateFr(b.date_verification))}</p>
          <details><summary>Faits liés</summary>${listeFaitsLies(b.faits_lies)}</details>
          <div class="actions"><button type="button" data-copier-boycott="${esc(b.id)}">Copier</button>${boutonSignaler('Boycotts', b.marque, b.id)}</div>
        </article>`).join('')).join('');
  };
  champ.addEventListener('input', dessiner);
  brancherFiltres('boycotts', dessiner);
  dessiner();
}

// Parcours « Besoin d'arguments ? » : trois questions, puis une fiche de réponse
function vueParcours() {
  const p = etat.parcours;
  if (!p) { vue().innerHTML = '<p class="vide">Parcours indisponible.</p>'; return; }
  const n = reponsesParcours.length;
  if (n < p.questions.length) {
    const q = p.questions[n];
    vue().innerHTML = `
      <p class="etape">Question ${n + 1} sur ${p.questions.length}</p>
      <h2>${esc(q.texte)}</h2>
      <div class="options">${q.options.map((o) => `<button type="button" data-reponse="${esc(o)}">${esc(o)}</button>`).join('')}</div>
      <div class="actions">${n ? '<button type="button" data-parcours="retour">Retour</button>' : ''}<a class="bouton" href="#arguments">Annuler</a></div>`;
    return;
  }

  const [contexte, sujet, ton] = reponsesParcours;
  const conf = p.themes[sujet] || { themes: [], repliques: {} };
  if (conf.renvoi === 'boycotts') { location.hash = '#boycotts'; reponsesParcours = []; return; }

  const ordre = p.ordre_fiabilite;
  const rang = (f) => ordre.indexOf(f.fiabilite) * 2 + (f.issue === 'sans-condamnation' ? 1 : 0);
  const faits = etat.faits
    .filter((f) => conf.themes.includes(f.theme) && f.fiabilite !== 'analyse')
    .sort((a, b) => rang(a) - rang(b))
    .slice(0, ton === 'Répondre court' ? 2 : 3);
  const rep = repliqueParId(conf.repliques[ton] || conf.repliques.defaut || Object.values(conf.repliques)[0]);

  vue().innerHTML = `
    <p class="etape">${esc(contexte)} · ${esc(sujet)} · ${esc(ton)}</p>
    <div class="avis">
      <p class="etiquette-avis">Mon point de vue : pour ouvrir</p>
      <p>${esc(p.ouvertures[contexte] || '')}</p>
    </div>
    ${rep ? `<div class="avis"><p class="etiquette-avis">Mon point de vue : réplique</p><p>${esc(rep.courte)}</p>
      <div class="actions"><button type="button" class="principal" data-copier-replique="${esc(rep.id)}">Copier la réplique avec sources</button></div></div>` : ''}
    <h2 class="section-titre">Faits les plus solides</h2>
    ${faits.length ? faits.map(carteFait).join('') : '<p class="vide">Pas encore de faits sourcés sur ce thème. Ils seront ajoutés lors d\'une mise à jour.</p>'}
    <h2 class="section-titre">Posture</h2>
    <p>${esc(p.conseils_contexte[contexte] || '')}</p>
    <p>${esc(p.conseils_ton[ton] || '')}</p>
    <div class="actions"><button type="button" data-parcours="recommencer">Recommencer</button></div>`;
}

/* ---------- Navigation ---------- */

const VUES = { arguments: vueArguments, faits: vueFaits, actus: vueActus, boycotts: vueBoycotts, reseaux: vueReseaux, parcours: vueParcours };

function router() {
  const nom = location.hash.slice(1) || 'arguments';
  const fn = VUES[nom] || vueArguments;
  if (nom !== 'parcours') reponsesParcours = [];
  document.querySelectorAll('.nav a').forEach((a) => {
    const actif = a.dataset.onglet === (nom === 'parcours' ? 'arguments' : nom);
    if (actif) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  fn();
  if (nom !== 'parcours') vue().insertAdjacentHTML('beforeend', piedSignalement());
  window.scrollTo(0, 0);
}

function majPastille() {
  const vus = new Set(lire('actus-vues', []));
  document.getElementById('pastille-actus').hidden = !etat.actus.some((a) => !vus.has(a.id));
}

// Un seul écouteur pour tous les boutons de l'app
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-copier-fait],[data-copier-replique],[data-copier-boycott],[data-fav],[data-reponse],[data-parcours],[data-voir-fait]');
  if (!el) return;
  const d = el.dataset;
  if (d.copierFait) copier(texteFait(faitParId(d.copierFait)));
  else if (d.copierBoycott) copier(texteBoycott(etat.boycotts.find((b) => b.id === d.copierBoycott)));
  else if (d.copierReplique) copier(texteReplique(repliqueParId(d.copierReplique)));
  else if (d.fav) {
    favoris.has(d.fav) ? favoris.delete(d.fav) : favoris.add(d.fav);
    ecrire('favoris', [...favoris]);
    const on = favoris.has(d.fav);
    el.setAttribute('aria-pressed', on);
    el.textContent = on ? 'Retirer des favoris' : 'Ajouter aux favoris';
  } else if (d.reponse) { reponsesParcours.push(d.reponse); vueParcours(); window.scrollTo(0, 0); }
  else if (d.parcours === 'retour') { reponsesParcours.pop(); vueParcours(); }
  else if (d.parcours === 'recommencer') { reponsesParcours = []; vueParcours(); }
  else if (d.voirFait) {
    // Affiche l'onglet Faits sans filtre puis fait défiler jusqu'au fait
    e.preventDefault();
    ecrire('decoches-faits', {}); ecrire('faits-favoris-seuls', false);
    location.hash = '#faits';
    setTimeout(() => document.getElementById('fait-' + d.voirFait)?.scrollIntoView(), 50);
  }
});

window.addEventListener('hashchange', router);

(async function demarrer() {
  const noms = ['faits', 'repliques', 'actus', 'boycotts', 'parcours', 'meta', 'reseaux'];
  const res = await Promise.all(noms.map((n) => fetch(`data/${n}.json`).then((r) => r.json()).catch(() => null)));
  noms.forEach((n, i) => { if (res[i]) etat[n] = res[i]; });
  if (etat.meta.derniere_maj) document.getElementById('maj').textContent = 'Mis à jour le ' + dateFr(etat.meta.derniere_maj);
  majPastille();
  router();
  if ('serviceWorker' in navigator) {
    // Nouvelle version installée : recharger une fois pour l'afficher tout de suite
    const avaitUneVersion = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (avaitUneVersion) location.reload(); });
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
