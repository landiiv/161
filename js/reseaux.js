// Onglet « Réseaux » : toile des liens (famille, propriété, direction, financement)
// entre grandes fortunes, entreprises et médias. Chaque lien est sourcé dans data/reseaux.json.
// Ce fichier utilise les outils de js/app.js (esc, norm, lire, ecrire, blocFiltres...).
'use strict';

// Comment lire chaque type de lien, vu depuis l'une ou l'autre extrémité
const TYPES_LIEN = {
  parent: { cat: 'famille', de: 'Parent de', vers: 'Enfant de', phrase: '{a} est le parent de {b}' },
  conjoint: { cat: 'famille', de: 'En couple avec', vers: 'En couple avec', phrase: '{a} et {b} sont en couple' },
  fratrie: { cat: 'famille', de: 'Même fratrie que', vers: 'Même fratrie que', phrase: '{a} et {b} sont de la même fratrie' },
  parrains_croises: { cat: 'proches', de: 'Parrains croisés avec', vers: 'Parrains croisés avec', phrase: "{a} et {b} sont chacun parrain d'un enfant de l'autre" },
  designe: { cat: 'nominations', de: 'A désigné ou choisi', vers: 'Désigné(e) par', phrase: '{a} a désigné ou choisi {b}' },
  formateur: { cat: 'nominations', de: 'Chargé de la mission :', vers: 'Mission confiée à', phrase: '{a} a été chargé de la mission : {b}' },
  candidat: { cat: 'nominations', de: 'Candidat(e) sur une liste de', vers: 'Candidat(e) :', phrase: "{a} a été candidat sur une liste de : {b}" },
  collaborateur: { cat: 'affaires', de: 'Proche collaborateur de', vers: 'Proche collaborateur :', phrase: '{a} a été un proche collaborateur de {b}' },
  soutien: { cat: 'soutiens', de: 'Soutient publiquement', vers: 'Soutenu publiquement par', phrase: '{a} a publiquement soutenu {b}' },
  declaration: { cat: 'soutiens', de: "S'est exprimé sur", vers: 'Objet de déclarations de', phrase: "{a} s'est exprimé publiquement sur {b}" },
  invite_evenement: { cat: 'soutiens', de: "Invité à un événement de", vers: 'A invité', phrase: '{a} a été invité à un événement de {b}' },
  membre: { cat: 'famille', de: 'Membre de', vers: 'Membre :', phrase: '{a} fait partie de : {b}' },
  alliance: { cat: 'famille', de: 'Allié par mariage à', vers: 'Allié par mariage :', phrase: '{a} : alliance par mariage avec {b}' },
  parrain: { cat: 'proches', de: 'Parrain de', vers: 'Filleul de', phrase: '{a} est le parrain de {b}' },
  temoin: { cat: 'proches', de: 'Témoin de mariage de', vers: 'Témoin à son mariage :', phrase: '{a} a été témoin au mariage de {b}' },
  invite: { cat: 'proches', de: 'Invité de', vers: 'A reçu', phrase: '{a} a été invité par {b}' },
  possede: { cat: 'propriete', de: 'Actionnaire de', vers: 'Détenu par', phrase: '{a} est actionnaire de {b}' },
  copropriete: { cat: 'propriete', de: 'Copropriétaire de', vers: 'Copropriétaire :', phrase: '{a} est copropriétaire de {b}' },
  dirige: { cat: 'direction', de: 'Dirige', vers: 'Dirigé par', phrase: '{a} dirige {b}' },
  fonde: { cat: 'direction', de: 'Fondateur de', vers: 'Fondé par', phrase: '{a} a fondé {b}' },
  siege: { cat: 'direction', de: 'Membre du conseil de', vers: 'Au conseil :', phrase: '{a} siège au conseil de {b}' },
  fonction: { cat: 'affaires', de: 'Travaille pour', vers: 'Y travaille :', phrase: '{a} travaille pour {b}' },
  edite: { cat: 'affaires', de: 'Publie chez', vers: 'A publié', phrase: '{a} publie chez {b}' },
  finance: { cat: 'financement', de: 'Finance', vers: 'Financé par', phrase: '{a} finance {b}' }
};
const CATS_LIEN = { famille: 'Famille', proches: 'Proches (parrain, témoin, invité)', propriete: 'Propriété', direction: 'Direction et conseils', affaires: 'Emplois et contrats', nominations: 'Nominations, missions et candidatures', soutiens: 'Soutiens et déclarations publiques', financement: 'Financement' };
const TYPES_NOEUD = { personne: 'Personne', famille: 'Famille', entreprise: 'Entreprise', media: 'Média', institution: 'Institution ou parti', autre: 'Autre' };
const EXPLIC_CAT = {
  famille: 'Lien familial (filiation, couple, mariage), documenté par la presse. Les conjoints sans rôle public ne sont pas nommés.',
  proches: 'Relation personnelle documentée : parrainage, témoin de mariage, invitation.',
  propriete: "L'un détient tout ou partie du capital de l'autre.",
  direction: "Fonction de direction ou siège au conseil d'administration.",
  affaires: 'Emploi, contrat ou publication.',
  nominations: 'Désignation à un poste ou mission confiée, telle que rapportée par la presse.',
  soutiens: 'Soutien, déclaration ou invitation publique, rapportés par la presse avec les mots de la personne.',
  financement: 'Argent versé ou prévu pour un projet.'
};
const EXPLIC_NOEUD = {
  personne: 'Personne ayant un rôle public (dirigeant, actionnaire, responsable politique).',
  famille: 'Famille citée comme actionnaire, sans détailler chaque membre.',
  entreprise: 'Entreprise ou holding (société qui détient des parts d’autres sociétés).',
  media: 'Média : journal, magazine, radio, télévision ou site.',
  institution: 'Organisme public, intercommunale, parti politique ou mission publique.',
  autre: 'Projet ou bien : projet politique, domaine viticole...'
};

let toile = null; // positions calculées, zoom, sélection (gardés d'une ouverture à l'autre)

/* ---------- Mise en page ---------- */

// Algorithme « à ressorts » (Fruchterman-Reingold), calculé une seule fois, sans animation.
// Chaque réseau part d'un point du cercle, puis les liens rapprochent ce qui est lié.
function calculerPositions(noeuds, liens, reseaux) {
  let graine = 7; // pseudo-hasard fixe : la toile garde la même forme à chaque ouverture
  const alea = () => (graine = (graine * 16807) % 2147483647) / 2147483647;
  const cles = Object.keys(reseaux);
  const centre = {};
  cles.forEach((k, i) => {
    const a = (2 * Math.PI * i) / cles.length;
    centre[k] = { x: Math.cos(a) * 260, y: Math.sin(a) * 260 };
  });
  const P = {};
  noeuds.forEach((nd) => {
    const c = centre[nd.reseau] || { x: 0, y: 0 };
    P[nd.id] = { x: c.x + (alea() - 0.5) * 160, y: c.y + (alea() - 0.5) * 160, dx: 0, dy: 0 };
  });
  const ids = Object.keys(P);
  const K = 48; // distance idéale entre deux éléments liés
  const TOURS = 450;
  for (let tour = 0; tour < TOURS; tour++) {
    const temperature = 40 * (1 - tour / TOURS) + 0.5;
    ids.forEach((id) => { P[id].dx = 0; P[id].dy = 0; });
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = P[ids[i]], b = P[ids[j]];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d = Math.hypot(dx, dy) || 0.01;
        if (d > 4 * K) continue; // au-delà, pas de répulsion : la toile reste compacte
        const f = (K * K) / d;
        a.dx += (dx / d) * f; a.dy += (dy / d) * f;
        b.dx -= (dx / d) * f; b.dy -= (dy / d) * f;
      }
    }
    liens.forEach((l) => {
      const a = P[l.de], b = P[l.vers];
      if (!a || !b) return;
      const dx = a.x - b.x, dy = a.y - b.y;
      const d = Math.hypot(dx, dy) || 0.01;
      const f = (d * d) / K;
      a.dx -= (dx / d) * f; a.dy -= (dy / d) * f;
      b.dx += (dx / d) * f; b.dy += (dy / d) * f;
    });
    noeuds.forEach((nd) => { // attraction vers le centre de son réseau et vers le centre de la toile
      const p = P[nd.id], c = centre[nd.reseau] || { x: 0, y: 0 };
      p.dx += (c.x - p.x) * 0.25 - p.x * 0.12; p.dy += (c.y - p.y) * 0.25 - p.y * 0.12;
    });
    ids.forEach((id) => {
      const p = P[id];
      const d = Math.hypot(p.dx, p.dy) || 0.01;
      const pas = Math.min(d, temperature);
      p.x += (p.dx / d) * pas; p.y += (p.dy / d) * pas;
    });
  }
  return P;
}

/* ---------- Données utiles ---------- */

const noeudParId = (id) => etat.reseaux.noeuds.find((n) => n.id === id);
const finLien = (l) => (/^\d{4}$/.test(String(l.fin)) ? `terminé en ${l.fin}` : 'terminé');
const catLien = (l) => (TYPES_LIEN[l.type] || {}).cat || 'propriete';

// Éléments et liens visibles selon les filtres cochés
function visibles() {
  const R = etat.reseaux;
  const noeuds = new Set(R.noeuds.filter((n) => passe('reseaux', n, ['reseau', 'pays'])).map((n) => n.id));
  const liens = R.liens.filter((l) => noeuds.has(l.de) && noeuds.has(l.vers) && passe('reseaux', { cat: catLien(l) }, ['cat']));
  return { noeuds, liens };
}

// Phrase lisible d'un lien, vu depuis l'élément « depuis »
function phraseLien(l, depuis) {
  const t = TYPES_LIEN[l.type] || { de: l.type, vers: l.type };
  const sens = l.de === depuis ? 'de' : 'vers';
  const autre = noeudParId(sens === 'de' ? l.vers : l.de);
  return { verbe: t[sens], autre };
}

/* ---------- Dessin ---------- */

function formeNoeud(type) {
  switch (type) {
    case 'personne': return '<circle r="7"/>';
    case 'famille': return '<circle r="9"/><circle r="4.5" class="interieur"/>';
    case 'entreprise': return '<rect x="-7" y="-7" width="14" height="14"/>';
    case 'media': return '<path d="M0,-9 L9,0 L0,9 L-9,0 Z"/>';
    case 'institution': return '<path d="M-8,-5 L0,-9 L8,-5 L8,5 L0,9 L-8,5 Z"/>';
    default: return '<path d="M0,-9 L8,6 L-8,6 Z"/>';
  }
}

function svgToile() {
  const R = etat.reseaux, P = toile.pos;
  const liens = R.liens.map((l, i) => {
    const a = P[l.de], b = P[l.vers];
    // On arrête le trait au bord de l'élément d'arrivée pour que la flèche reste visible
    const d = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const x2 = b.x - ((b.x - a.x) / d) * 11, y2 = b.y - ((b.y - a.y) / d) * 11;
    const cat = catLien(l);
    const fleche = ['conjoint', 'alliance', 'fratrie', 'parrains_croises'].includes(l.type) ? '' : ' marker-end="url(#fleche)"';
    return `<line class="lien lien-${cat}${l.fin ? ' lien-fini' : ''}" data-i="${i}" x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"${fleche}/>` +
      `<line class="lien-zone" data-i="${i}" x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}"/>`;
  }).join('');
  const noeuds = R.noeuds.map((n) => `
    <g class="noeud noeud-${esc(n.type)}" data-id="${esc(n.id)}" transform="translate(${P[n.id].x.toFixed(1)},${P[n.id].y.toFixed(1)})">
      <circle r="18" class="zone"/>${formeNoeud(n.type)}<text y="21">${esc(n.nom)}</text>
    </g>`).join('');
  return `<svg id="toile" role="img" aria-label="Toile des liens entre grandes fortunes, entreprises et médias. La vue liste donne le même contenu en texte.">
    <defs><marker id="fleche" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 Z"/></marker></defs>
    <g id="monde"><g>${liens}</g><g>${noeuds}</g></g>
  </svg>`;
}

function appliquerVue() {
  const v = toile.vue;
  const monde = document.getElementById('monde');
  if (!monde) return;
  monde.setAttribute('transform', `translate(${v.x.toFixed(1)},${v.y.toFixed(1)}) scale(${v.s.toFixed(3)})`);
  // Vue de loin : on n'affiche que les noms utiles pour garder la toile lisible
  document.getElementById('toile').classList.toggle('loin', v.s < 0.75);
}

function recentrer() {
  const svg = document.getElementById('toile');
  if (!svg) return;
  const { noeuds } = visibles();
  const pts = [...noeuds].map((id) => toile.pos[id]);
  if (!pts.length) return;
  const W = svg.clientWidth, H = svg.clientHeight;
  const minX = Math.min(...pts.map((p) => p.x)) - 40, maxX = Math.max(...pts.map((p) => p.x)) + 40;
  const minY = Math.min(...pts.map((p) => p.y)) - 40, maxY = Math.max(...pts.map((p) => p.y)) + 40;
  const s = Math.min(W / (maxX - minX), H / (maxY - minY), 2);
  toile.vue = { s, x: W / 2 - ((minX + maxX) / 2) * s, y: H / 2 - ((minY + maxY) / 2) * s };
  appliquerVue();
}

function zoomer(facteur, cx, cy) {
  const v = toile.vue;
  const s = Math.max(0.15, Math.min(4, v.s * facteur));
  const k = s / v.s;
  v.x = cx - (cx - v.x) * k; v.y = cy - (cy - v.y) * k; v.s = s;
  appliquerVue();
}

function centrerSur(id) {
  const svg = document.getElementById('toile'), p = toile.pos[id];
  if (!svg || !p) return;
  const v = toile.vue;
  v.s = Math.max(v.s, 1.1);
  v.x = svg.clientWidth / 2 - p.x * v.s; v.y = svg.clientHeight / 2 - p.y * v.s;
  appliquerVue();
}

// Masque ce qui est décoché et met en avant l'élément choisi et ses voisins
function majClasses() {
  const svg = document.getElementById('toile');
  if (!svg) return;
  const { noeuds, liens } = visibles();
  const actifs = new Set(liens);
  const voisins = new Set();
  const lc = toile.lienChoisi;
  etat.reseaux.liens.forEach((l, i) => {
    const el = svg.querySelector(`.lien[data-i="${i}"]`);
    const visible = actifs.has(l);
    const touche = visible && (lc !== null ? i === lc : toile.choisi && (l.de === toile.choisi || l.vers === toile.choisi));
    if (touche) { voisins.add(l.de); voisins.add(l.vers); }
    el.classList.toggle('cache', !visible);
    el.classList.toggle('actif', !!touche);
    svg.querySelector(`.lien-zone[data-i="${i}"]`).classList.toggle('cache', !visible);
  });
  svg.querySelectorAll('.noeud').forEach((g) => {
    const id = g.dataset.id;
    g.classList.toggle('cache', !noeuds.has(id));
    g.classList.toggle('choisi', id === toile.choisi);
    g.classList.toggle('voisin', voisins.has(id));
  });
  svg.classList.toggle('focus', (!!toile.choisi && noeuds.has(toile.choisi)) || lc !== null);
}

/* ---------- Panneau de détail et liste ---------- */

function ligneLien(l, depuis) {
  const { verbe, autre } = phraseLien(l, depuis);
  const perime = aRevérifier(l.date_verification);
  return `<li><strong>${esc(verbe)}</strong> <button type="button" class="lien" data-aller="${esc(autre.id)}">${esc(autre.nom)}</button>${l.detail ? ` (${esc(l.detail)})` : ''}${l.fin ? ` <span class="issue">Lien ${esc(finLien(l))}</span>` : ''}
    <span class="source">${badge(l.fiabilite)} Source : <a href="${esc(l.source_url)}" target="_blank" rel="noopener">${esc(l.source_nom)}</a>, ${esc(l.date_source)}${perime ? ' · <span class="perime">à revérifier</span>' : ''}</span></li>`;
}

function dessinerPanneau() {
  const zone = document.getElementById('panneau');
  if (!zone) return;
  const n = toile.choisi && noeudParId(toile.choisi);
  if (!n) { zone.innerHTML = '<p class="vide">Touchez un élément de la toile pour voir ses liens et leurs sources.</p>'; return; }
  const { liens } = visibles();
  const siens = liens.filter((l) => l.de === n.id || l.vers === n.id);
  const reseau = etat.reseaux.reseaux[n.reseau];
  const boycotts = (n.boycotts || []).map((id) => etat.boycotts.find((b) => b.id === id)).filter(Boolean);
  const faits = (n.faits || []).map(faitParId).filter(Boolean);
  zone.innerHTML = `<article class="fiche">
    <div class="tete"><span class="issue">${esc(TYPES_NOEUD[n.type] || n.type)}</span><span>Réseau ${esc(reseau ? reseau.nom : n.reseau)} · ${esc(PAYS[n.pays] || n.pays)}</span></div>
    <h3>${esc(n.nom)}</h3>
    ${n.role ? `<p class="source">${esc(n.role)}</p>` : ''}
    ${siens.length ? `<ul class="liens-noeud">${siens.map((l) => ligneLien(l, n.id)).join('')}</ul>` : '<p class="vide">Aucun lien visible avec ces filtres.</p>'}
    ${boycotts.length ? `<p>Fiche boycott : ${boycotts.map((b) => `<button type="button" class="lien" data-voir-boycott="${esc(b.marque)}">${esc(b.marque)}</button>`).join(', ')}</p>` : ''}
    ${faits.length ? `<p>Faits liés : ${faits.map((f) => `<a href="#faits" data-voir-fait="${esc(f.id)}">${esc(f.titre)}</a>`).join(' ; ')}</p>` : ''}
    <div class="actions"><button type="button" data-copier-noeud="${esc(n.id)}">Copier ces liens</button>${boutonSignaler('Réseaux', n.nom, n.id)}</div>
  </article>`;
}

function texteNoeud(id) {
  const n = noeudParId(id);
  const lignes = visibles().liens.filter((l) => l.de === id || l.vers === id).map((l) => {
    const { verbe, autre } = phraseLien(l, id);
    return `- ${verbe} ${autre.nom}${l.detail ? ` (${l.detail})` : ''}${l.fin ? ` [${finLien(l)}]` : ''}. Source : ${l.source_nom}, ${l.date_source}. ${l.source_url}`;
  });
  return `${n.nom} :\n${lignes.join('\n')}`;
}

function dessinerListe() {
  const zone = document.getElementById('liste-reseaux');
  if (!zone) return;
  const R = etat.reseaux;
  const { noeuds, liens } = visibles();
  zone.innerHTML = Object.entries(R.reseaux).map(([cle, r]) => {
    const membres = R.noeuds.filter((n) => n.reseau === cle && noeuds.has(n.id));
    const lignes = membres.map((n) => {
      const sortants = liens.filter((l) => l.de === n.id);
      return sortants.length ? `<li><strong>${esc(n.nom)}</strong><ul class="liens-noeud">${sortants.map((l) => ligneLien(l, n.id)).join('')}</ul></li>` : '';
    }).join('');
    return lignes ? `<h3 class="section-titre">${esc(r.nom)} (${esc(PAYS[r.pays] || r.pays)})</h3><ul class="liste-reseau">${lignes}</ul>` : '';
  }).join('') || '<p class="vide">Rien à afficher avec ces filtres.</p>';
}

// Phrase complète d'un lien : « Groupe Bolloré est actionnaire de Canal+ »
function phraseComplete(l) {
  const t = TYPES_LIEN[l.type] || { phrase: '{a} : {b}' };
  return t.phrase.replace('{a}', noeudParId(l.de).nom).replace('{b}', noeudParId(l.vers).nom);
}

function dessinerCarte() {
  const c = document.getElementById('carte-info');
  if (!c) return;
  const fermer = '<button type="button" class="fermer" data-fermer aria-label="Fermer l\'explication">×</button>';
  if (toile.lienChoisi !== null) {
    const l = etat.reseaux.liens[toile.lienChoisi];
    const cat = catLien(l);
    const de = noeudParId(l.de), vers = noeudParId(l.vers);
    c.innerHTML = `${fermer}<p class="carte-cat">Lien : ${esc(CATS_LIEN[cat] || cat)}</p>
      <p class="carte-phrase">${esc(phraseComplete(l))}${l.detail ? ` (${esc(l.detail)})` : ''}.${l.fin ? ` <span class="issue">${esc(finLien(l).replace('t', 'T'))}</span>` : ''}</p>
      <p class="source">${esc(EXPLIC_CAT[cat] || '')}</p>
      <p class="source">${badge(l.fiabilite)} Source : <a href="${esc(l.source_url)}" target="_blank" rel="noopener">${esc(l.source_nom)}</a>, ${esc(l.date_source)}${aRevérifier(l.date_verification) ? ' · <span class="perime">à revérifier</span>' : ''}</p>
      <div class="actions"><button type="button" class="lien" data-aller="${esc(de.id)}">Voir ${esc(de.nom)}</button><button type="button" class="lien" data-aller="${esc(vers.id)}">Voir ${esc(vers.nom)}</button></div>`;
  } else if (toile.choisi) {
    const n = noeudParId(toile.choisi);
    const r = etat.reseaux.reseaux[n.reseau];
    const nb = visibles().liens.filter((l) => l.de === n.id || l.vers === n.id).length;
    c.innerHTML = `${fermer}<p class="carte-cat">${esc(TYPES_NOEUD[n.type] || n.type)} · réseau ${esc(r ? r.nom : n.reseau)}</p>
      <p class="carte-phrase"><strong>${esc(n.nom)}</strong>${n.role ? ` : ${esc(n.role)}` : ''}</p>
      <p class="source">${esc(EXPLIC_NOEUD[n.type] || '')} ${nb} lien${nb > 1 ? 's' : ''} en surbrillance : touchez un trait pour son explication.</p>
      <div class="actions"><button type="button" class="lien" data-voir-panneau>Voir tous ses liens et leurs sources</button></div>`;
  } else {
    c.innerHTML = '<p class="source">Touchez un élément pour savoir qui ou ce que c\'est, ou un trait pour comprendre le lien. Glissez pour vous déplacer, pincez ou utilisez + et − pour zoomer.</p>';
  }
}

function choisir(id, centrer) {
  toile.choisi = id;
  toile.lienChoisi = null;
  majClasses();
  dessinerPanneau();
  dessinerCarte();
  if (id && centrer) centrerSur(id);
}

function choisirLien(i) {
  toile.choisi = null;
  toile.lienChoisi = i;
  majClasses();
  dessinerPanneau();
  dessinerCarte();
}

/* ---------- Vue ---------- */

function vueReseaux() {
  const R = etat.reseaux;
  if (!R || !R.noeuds) { vue().innerHTML = '<p class="vide">Données indisponibles.</p>'; return; }
  if (!toile) toile = { pos: calculerPositions(R.noeuds, R.liens, R.reseaux), vue: { s: 1, x: 0, y: 0 }, choisi: null, lienChoisi: null, liste: false };
  const ordreReseaux = Object.keys(R.reseaux);
  const groupes = [
    { cle: 'pays', titre: 'Pays', options: optionsDe([R.noeuds], 'pays', PAYS, Object.keys(PAYS)) },
    { cle: 'cat', titre: 'Type de lien', options: Object.entries(CATS_LIEN) },
    { cle: 'reseau', titre: 'Réseau', options: ordreReseaux.map((k) => [k, R.reseaux[k].nom]) }
  ];
  vue().innerHTML = `
    <h2>Réseaux</h2>
    <p class="intro">Liens familiaux, de propriété et de direction entre grandes fortunes, entreprises et médias, en France et en Belgique. Chaque lien est sourcé. La toile décrit des liens, pas des opinions.</p>
    <label for="recherche" class="etiquette-avis">Chercher une personne, une entreprise ou un média</label>
    <input id="recherche" type="search" placeholder="Ex. : Bolloré, Le Soir, GBL" autocomplete="off">
    <div id="suggestions" class="suggestions"></div>
    ${blocFiltres('reseaux', groupes)}
    <div class="actions"><button type="button" id="bascule">${toile.liste ? 'Voir la toile' : 'Voir en liste'}</button></div>
    <div id="zone-toile"${toile.liste ? ' hidden' : ''}>
      <div class="toile-cadre">${svgToile()}
        <div id="carte-info" class="carte-info" aria-live="polite"></div>
        <div class="toile-boutons">
          <button type="button" data-zoom="plus" aria-label="Zoomer">+</button>
          <button type="button" data-zoom="moins" aria-label="Dézoomer">−</button>
          <button type="button" data-zoom="centrer">Recentrer</button>
        </div>
      </div>
      <p class="legende-toile">● personne · ◎ famille · ■ entreprise · ◆ média · ⬡ institution ou parti · ▲ autre. Trait plein : famille ou propriété ; tirets : direction ; tirets longs : emplois et contrats ; tirets alternés : nominations ; traits mixtes : soutiens et déclarations ; pointillés : financement ; tirets et points : proches. Trait pâle : lien terminé. La flèche va du propriétaire ou du parent vers ce qu'il détient ou dirige.</p>
      <div id="panneau"></div>
    </div>
    <div id="liste-reseaux"${toile.liste ? '' : ' hidden'}></div>`;

  const svg = document.getElementById('toile');
  majClasses();
  recentrer();
  if (toile.choisi) centrerSur(toile.choisi);
  dessinerPanneau();
  dessinerCarte();
  dessinerListe();

  // Filtres
  brancherFiltres('reseaux', () => { majClasses(); recentrer(); dessinerPanneau(); dessinerCarte(); dessinerListe(); });

  // Bascule toile / liste
  document.getElementById('bascule').addEventListener('click', (e) => {
    toile.liste = !toile.liste;
    document.getElementById('zone-toile').hidden = toile.liste;
    document.getElementById('liste-reseaux').hidden = !toile.liste;
    e.currentTarget.textContent = toile.liste ? 'Voir la toile' : 'Voir en liste';
    if (!toile.liste) recentrer();
  });

  // Recherche : propose jusqu'à 8 éléments, un tap les sélectionne
  const champ = document.getElementById('recherche');
  champ.addEventListener('input', () => {
    const q = norm(champ.value.trim());
    const res = q ? R.noeuds.filter((n) => norm(n.nom).includes(q)).slice(0, 8) : [];
    document.getElementById('suggestions').innerHTML = res.map((n) =>
      `<button type="button" class="chip" data-aller="${esc(n.id)}">${esc(n.nom)}</button>`).join('');
  });

  // Boutons de zoom
  vue().querySelectorAll('[data-zoom]').forEach((b) => b.addEventListener('click', () => {
    const W = svg.clientWidth / 2, H = svg.clientHeight / 2;
    if (b.dataset.zoom === 'plus') zoomer(1.4, W, H);
    else if (b.dataset.zoom === 'moins') zoomer(1 / 1.4, W, H);
    else recentrer();
  }));

  // Déplacement au doigt ou à la souris, pincement pour zoomer, tap pour choisir
  const pointeurs = new Map();
  let depart = null, aBouge = false, ecartPrec = 0;
  svg.addEventListener('pointerdown', (e) => {
    // Un nouveau premier doigt (ou un clic) commence un nouveau geste : on oublie les anciens pointeurs
    if (e.isPrimary) pointeurs.clear();
    try { svg.setPointerCapture(e.pointerId); } catch { /* pointeur déjà relâché */ }
    pointeurs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointeurs.size === 1) {
      const g = e.target.closest('.noeud');
      const z = e.target.closest('.lien-zone');
      depart = { x: e.clientX, y: e.clientY, id: g ? g.dataset.id : null, lien: !g && z ? Number(z.dataset.i) : null };
      aBouge = false;
    } else {
      const [a, b] = [...pointeurs.values()];
      ecartPrec = Math.hypot(a.x - b.x, a.y - b.y);
      aBouge = true;
    }
  });
  svg.addEventListener('pointermove', (e) => {
    if (!pointeurs.has(e.pointerId)) return;
    const prec = pointeurs.get(e.pointerId);
    pointeurs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointeurs.size === 1) {
      if (depart && Math.hypot(e.clientX - depart.x, e.clientY - depart.y) > 6) aBouge = true;
      if (aBouge) { toile.vue.x += e.clientX - prec.x; toile.vue.y += e.clientY - prec.y; appliquerVue(); }
    } else if (pointeurs.size === 2) {
      const [a, b] = [...pointeurs.values()];
      const ecart = Math.hypot(a.x - b.x, a.y - b.y);
      const r = svg.getBoundingClientRect();
      if (ecartPrec) zoomer(ecart / ecartPrec, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top);
      ecartPrec = ecart;
    }
  });
  const fin = (e) => {
    pointeurs.delete(e.pointerId);
    if (pointeurs.size === 0 && depart && !aBouge) {
      if (depart.lien !== null) choisirLien(depart.lien); else choisir(depart.id, false);
    }
    if (pointeurs.size === 0) depart = null;
  };
  svg.addEventListener('pointerup', fin);
  svg.addEventListener('pointercancel', (e) => { pointeurs.delete(e.pointerId); depart = null; });
  svg.addEventListener('lostpointercapture', (e) => { pointeurs.delete(e.pointerId); });
  svg.addEventListener('wheel', (e) => {
    e.preventDefault();
    const r = svg.getBoundingClientRect();
    zoomer(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX - r.left, e.clientY - r.top);
  }, { passive: false });

  // Liens du panneau, de la liste et des suggestions
  vue().addEventListener('click', (e) => {
    const aller = e.target.closest('[data-aller]');
    if (aller) {
      if (toile.liste) document.getElementById('bascule').click();
      choisir(aller.dataset.aller, true);
      document.getElementById('suggestions').innerHTML = '';
      document.querySelector('.toile-cadre').scrollIntoView({ block: 'nearest' });
      return;
    }
    if (e.target.closest('[data-fermer]')) { choisir(null, false); return; }
    if (e.target.closest('[data-voir-panneau]')) { document.getElementById('panneau').scrollIntoView({ block: 'start' }); return; }
    const copie = e.target.closest('[data-copier-noeud]');
    if (copie) copier(texteNoeud(copie.dataset.copierNoeud));
    const boy = e.target.closest('[data-voir-boycott]');
    if (boy) { ecrire('boycott-recherche', boy.dataset.voirBoycott); ecrire('decoches-boycotts', {}); location.hash = '#boycotts'; }
  });
}
