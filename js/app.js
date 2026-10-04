// Argumentaire : logique de l'app (JavaScript natif, sans framework).
// Le contenu vient des fichiers data/*.json ; ce fichier ne fait que l'afficher.
'use strict';

const etat = { faits: [], repliques: [], actus: [], boycotts: [], parcours: null, meta: {} };
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
const PAYS = { BE: 'Belgique', FR: 'France', UE: 'Union européenne' };
const THEMES = { police: 'Police', 'extreme-droite': 'Extrême droite', democratie: 'Démocratie', medias: 'Médias', methode: 'Méthode' };
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
function options(map, valeur, tous) {
  return `<option value="">${tous}</option>` + Object.entries(map)
    .map(([k, v]) => `<option value="${esc(k)}"${k === valeur ? ' selected' : ''}>${esc(v)}</option>`).join('');
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
  let t = `${b.marque} (${b.groupe}) : ${b.raison}\nSource : ${b.source_nom}. ${b.source_url}`;
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

/* ---------- Vues ---------- */

const vue = () => document.getElementById('vue');

function vueArguments() {
  vue().innerHTML = `
    <a class="bouton principal gros" href="#parcours">Besoin d'arguments ?<small>Trois questions, une réponse prête à copier</small></a>
    <label for="recherche" class="etiquette-avis">Chercher une objection ou un fait</label>
    <input id="recherche" type="search" placeholder="Ex. : début, plainte, Mawda" autocomplete="off">
    <div id="resultats"></div>`;
  const champ = document.getElementById('recherche');
  const dessiner = () => {
    const q = norm(champ.value.trim());
    const reps = etat.repliques.filter((r) => !q || norm(r.objection + ' ' + r.courte + ' ' + r.longue).includes(q));
    const faits = q ? etat.faits.filter((f) => norm(f.titre + ' ' + f.resume + ' ' + f.source_nom).includes(q)) : [];
    document.getElementById('resultats').innerHTML =
      `<h2 class="section-titre">On me dit...</h2>` +
      (reps.length ? reps.map((r) => blocReplique(r, false)).join('') : '<p class="vide">Aucune objection trouvée.</p>') +
      (q ? `<h2 class="section-titre">Faits</h2>` + (faits.length ? faits.map(carteFait).join('') : '<p class="vide">Aucun fait trouvé.</p>') : '');
  };
  champ.addEventListener('input', dessiner);
  dessiner();
}

function vueFaits() {
  const f = lire('filtres-faits', { pays: '', theme: '', fiab: '', fav: false });
  const fiabs = Object.fromEntries(Object.entries(FIABILITE).map(([k, v]) => [k, v.label]));
  vue().innerHTML = `
    <h2>Faits</h2>
    <form class="filtres" id="filtres">
      <label>Pays<select name="pays">${options(PAYS, f.pays, 'Tous')}</select></label>
      <label>Thème<select name="theme">${options(THEMES, f.theme, 'Tous')}</select></label>
      <label class="large">Fiabilité<select name="fiab">${options(fiabs, f.fiab, 'Toutes')}</select></label>
      <label class="case large"><input type="checkbox" name="fav"${f.fav ? ' checked' : ''}> Mes favoris seulement</label>
    </form>
    <div id="liste"></div>`;
  const form = document.getElementById('filtres');
  const dessiner = () => {
    const v = { pays: form.pays.value, theme: form.theme.value, fiab: form.fiab.value, fav: form.fav.checked };
    ecrire('filtres-faits', v);
    const liste = etat.faits.filter((x) =>
      (!v.pays || x.pays === v.pays) && (!v.theme || x.theme === v.theme) &&
      (!v.fiab || x.fiabilite === v.fiab) && (!v.fav || favoris.has(x.id)));
    document.getElementById('liste').innerHTML = liste.length ? liste.map(carteFait).join('') : '<p class="vide">Aucun fait pour ces filtres.</p>';
  };
  form.addEventListener('change', dessiner);
  dessiner();
}

function vueActus() {
  const vus = new Set(lire('actus-vues', []));
  const f = lire('filtres-actus', { pays: '', theme: '' });
  vue().innerHTML = `
    <h2>Actus</h2>
    <form class="filtres" id="filtres">
      <label>Pays<select name="pays">${options(PAYS, f.pays, 'Tous')}</select></label>
      <label>Thème<select name="theme">${options(THEMES, f.theme, 'Tous')}</select></label>
    </form>
    <div id="liste"></div>`;
  const form = document.getElementById('filtres');
  const dessiner = () => {
    const v = { pays: form.pays.value, theme: form.theme.value };
    ecrire('filtres-actus', v);
    const liste = etat.actus
      .filter((a) => (!v.pays || a.pays === v.pays) && (!v.theme || a.theme === v.theme))
      .sort((a, b) => b.date.localeCompare(a.date));
    document.getElementById('liste').innerHTML = liste.length ? liste.map((a) => `
      <article class="fiche">
        <div class="tete">${badge(a.fiabilite)}<span>${esc(dateFr(a.date))} · ${esc(PAYS[a.pays] || a.pays)}</span>${vus.has(a.id) ? '' : '<span class="nouveau">Nouveau</span>'}</div>
        <h3>${esc(a.titre)}</h3>
        <p>${esc(a.resume)}</p>
        <p class="nuance"><strong>Pourquoi ça compte :</strong> ${esc(a.pourquoi_ca_compte)}</p>
        <p class="source">Sources : ${(a.sources || []).map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.nom)}</a>`).join(', ')}</p>
        ${(a.faits_lies || []).map(faitParId).filter(Boolean).map((x) => `<p class="source">Fait lié : <a href="#faits" data-voir-fait="${esc(x.id)}">${esc(x.titre)}</a></p>`).join('')}
      </article>`).join('') : '<p class="vide">Aucune actu pour ces filtres.</p>';
  };
  form.addEventListener('change', dessiner);
  dessiner();
  // Les actus affichées ne sont plus « nouvelles » à la prochaine ouverture
  ecrire('actus-vues', etat.actus.map((a) => a.id));
  majPastille();
}

function vueBoycotts() {
  vue().innerHTML = `
    <h2>Boycotts</h2>
    <label for="marque" class="etiquette-avis">Chercher une marque</label>
    <input id="marque" type="search" placeholder="Nom de la marque ou du groupe" autocomplete="off">
    <div id="liste"></div>`;
  const champ = document.getElementById('marque');
  const dessiner = () => {
    const q = norm(champ.value.trim());
    // La recherche porte aussi sur les sous-marques (ex. « Fayard » trouve Hachette Livre)
    const actifs = etat.boycotts.filter((b) => b.statut !== 'retire' &&
      (!q || norm([b.marque, b.groupe, ...(b.sous_marques || [])].join(' ')).includes(q)));
    if (!etat.boycotts.length) {
      document.getElementById('liste').innerHTML = '<p class="vide">Aucune fiche pour l\'instant. Chaque marque est ajoutée seulement après vérification d\'une source solide.</p>';
      return;
    }
    if (!actifs.length) {
      document.getElementById('liste').innerHTML = '<p class="vide">Cette marque n\'est pas dans la liste.</p>';
      return;
    }
    const parSecteur = {};
    actifs.forEach((b) => (parSecteur[b.secteur] ||= []).push(b));
    document.getElementById('liste').innerHTML = Object.entries(parSecteur).map(([s, liste]) =>
      `<h3 class="section-titre">${esc(SECTEURS[s] || s)}</h3>` + liste.map((b) => `
        <article class="fiche">
          <div class="tete">${badge(b.fiabilite)}${b.statut === 'a-revoir' ? '<span class="issue">À revoir</span>' : ''}<span>${esc((b.pays || []).join(', '))}</span></div>
          <h3>${esc(b.marque)}</h3>
          <p class="source">Groupe : ${esc(b.groupe)}</p>
          ${(b.sous_marques || []).length ? `<p class="source">Marques concernées : ${esc(b.sous_marques.join(', '))}</p>` : ''}
          <p>${esc(b.raison)}</p>
          ${b.fiabilite === 'analyse' ? `<p class="avert">${AVERTISSEMENT_ANALYSE}</p>` : ''}
          ${b.nuance ? `<p class="nuance"><strong>Nuance :</strong> ${esc(b.nuance)}</p>` : ''}
          ${(b.alternatives || []).length ? `<p><strong>Alternatives :</strong> ${esc(b.alternatives.join(', '))}</p>` : ''}
          <p class="source">Source : <a href="${esc(b.source_url)}" target="_blank" rel="noopener">${esc(b.source_nom)}</a></p>
          <p class="verif${aRevérifier(b.date_verification) ? ' perime' : ''}">Vérifié le ${esc(dateFr(b.date_verification))}</p>
          <details><summary>Faits liés</summary>${listeFaitsLies(b.faits_lies)}</details>
          <div class="actions"><button type="button" data-copier-boycott="${esc(b.id)}">Copier</button></div>
        </article>`).join('')).join('');
  };
  champ.addEventListener('input', dessiner);
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

const VUES = { arguments: vueArguments, faits: vueFaits, actus: vueActus, boycotts: vueBoycotts, parcours: vueParcours };

function router() {
  const nom = location.hash.slice(1) || 'arguments';
  const fn = VUES[nom] || vueArguments;
  if (nom !== 'parcours') reponsesParcours = [];
  document.querySelectorAll('.nav a').forEach((a) => {
    const actif = a.dataset.onglet === (nom === 'parcours' ? 'arguments' : nom);
    if (actif) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  fn();
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
    ecrire('filtres-faits', { pays: '', theme: '', fiab: '', fav: false });
    location.hash = '#faits';
    setTimeout(() => document.getElementById('fait-' + d.voirFait)?.scrollIntoView(), 50);
  }
});

window.addEventListener('hashchange', router);

(async function demarrer() {
  const noms = ['faits', 'repliques', 'actus', 'boycotts', 'parcours', 'meta'];
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
