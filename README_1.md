# Bibliothèque Manager

Application web de gestion d'un catalogue de livres : consultation, ajout, emprunt, retour et suppression.

Mini-projet réalisé dans le cadre du module **JavaScript avancé (DOM, Fetch API, API REST)** — Licence 3 Développement Web.

> Contrainte du projet : **aucun framework**. HTML, CSS et JavaScript natifs uniquement, avec une API REST simulée par json-server.

---

## Fonctionnalités

- **Consultation** du catalogue sous forme de grille de cartes, avec couverture, auteur, catégorie et statut
- **Ajout** d'un livre via un formulaire en popup (titre, auteur, catégorie, URL de couverture)
- **Emprunt et retour** d'un livre par un bouton bascule
- **Suppression** d'un livre avec confirmation
- **Filtrage** par statut (tous / disponibles / empruntés) et par catégorie, combinables
- **Recherche** en temps réel sur le titre et l'auteur, insensible aux accents et à la casse
- **Statistiques** recalculées en direct sur la sélection affichée
- **Menu latéral rétractable**, réduit à une colonne de pastilles colorées
- **Notifications** en bas d'écran après chaque action
- **Repli automatique** sur les initiales du titre quand une couverture ne charge pas
- **Interface responsive** : le nombre de colonnes s'adapte à la largeur de l'écran

---

## Technologies

| Couche | Technologie |
|---|---|
| Structure | HTML5 |
| Présentation | CSS3 (Flexbox, Grid, media queries) |
| Comportement | JavaScript ES6+ (Fetch API, async/await) |
| Données | json-server (API REST simulée) |
| Polices | Lora et Work Sans (Google Fonts) |

---

## Installation

**Prérequis :** [Node.js](https://nodejs.org) (version 18 ou supérieure).

```bash
# 1. Cloner le dépôt
git clone https://github.com/VOTRE-PSEUDO/fdm_ges_biblio.git
cd fdm_ges_biblio

# 2. Installer json-server
npm install

# 3. Lancer l'API (à laisser tourner)
npm run server
```

L'API est alors disponible sur `http://localhost:4000/livres`.

**4. Ouvrir l'interface.** Dans VS Code, installer l'extension **Live Server**, puis clic droit sur `index.html` → *Open with Live Server*.

> Ne pas ouvrir `index.html` par un double-clic depuis l'explorateur de fichiers : sans serveur local, le navigateur bloque les requêtes `fetch`.

---

## Structure du projet

```
fdm_ges_biblio/
├── index.html      # structure de la page
├── style.css       # mise en forme
├── script.js       # logique : chargement, filtres, affichage, actions
├── db.json         # base de données simulée
├── package.json    # dépendance json-server
└── README.md
```

---

## L'API

json-server transforme `db.json` en API REST complète :

| Action | Méthode | Route |
|---|---|---|
| Lister les livres | `GET` | `/livres` |
| Ajouter un livre | `POST` | `/livres` |
| Modifier la disponibilité | `PATCH` | `/livres/:id` |
| Supprimer un livre | `DELETE` | `/livres/:id` |

### Modèle de données

```json
{
  "id": 1,
  "titre": "Le Petit Prince",
  "auteur": "Antoine de Saint-Exupéry",
  "categorie": "Roman",
  "image": "https://covers.openlibrary.org/b/isbn/9782070408504-L.jpg",
  "disponible": true
}
```

Le champ `disponible` pilote à lui seul le statut affiché, sa couleur, le libellé du bouton d'action et sa couleur.

---

## Ajouter une catégorie

Les catégories proviennent d'une source unique. Pour en ajouter une :

**1.** Dans `script.js`, ajouter une entrée à l'objet `CATEGORIES` :
```js
const CATEGORIES = {
  "Roman": "roman",
  "Poésie": "poesie",   // nouvelle entrée
};
```

**2.** Dans `style.css`, ajouter les deux couleurs correspondantes :
```css
.cat-poesie { background: #e8e2f0; color: #4a3d6b; }
.dot-poesie { background: #9b8ac4; }
```

Le bouton de filtre, son compteur et l'option du formulaire apparaissent automatiquement.

---

## Notes techniques

**Gestion des erreurs** — Si json-server n'est pas lancé, un message explicite remplace la grille au lieu d'une page vide. `fetch` ne levant pas d'exception sur un code HTTP 404 ou 500, `response.ok` est vérifié explicitement.

**Délégation d'événements** — Les cartes étant recréées à chaque filtrage, un unique écouteur est posé sur le conteneur parent plutôt qu'un écouteur par bouton.

**Couvertures** — Les images proviennent d'Open Library. L'attribut `onerror` retire l'image si l'URL ne répond pas, laissant apparaître les initiales du titre affichées en dessous.

---

## Auteur

Alia Niang — Licence 3, année universitaire 2025-2026.
