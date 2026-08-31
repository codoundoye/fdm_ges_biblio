const API_URL = "http://localhost:4000/livres";

// Les catégories et le suffixe de leurs classes CSS.
// Exemple : "Roman" -> classes "cat-roman" (badge, couverture) et "dot-roman" (menu).
const CATEGORIES = {
  "Roman": "roman",
  "Informatique": "informatique",
  "Histoire": "histoire",
  "Sciences": "sciences",
  "Bande dessinée": "bd",
};

const app = document.querySelector("#app");
const bookList = document.querySelector("#bookList");
const viewTitle = document.querySelector("#viewTitle");
const searchInput = document.querySelector("#search");
const categoryNav = document.querySelector("#categoryNav");
const categorieSelect = document.querySelector("#categorie");
const bookForm = document.querySelector("#bookForm");
const overlay = document.querySelector("#overlay");
const toast = document.querySelector("#toast");

let books = [];
let filtreStatut = "all";
let filtreCategorie = "all";
let recherche = "";


// ===== Petites fonctions utiles =====

// "Le Petit Prince" -> "PP" (on ignore les articles)
const MOTS_VIDES = ["le", "la", "les", "un", "une", "des", "du", "de", "d", "l"];

function getInitiales(titre) {
  const mots = titre.split(/[\s'’]+/).filter(function (mot) {
    return mot && !MOTS_VIDES.includes(mot.toLowerCase());
  });

  if (mots.length >= 2) {
    return (mots[0][0] + mots[1][0]).toUpperCase();
  }
  return (mots[0] || titre).slice(0, 2).toUpperCase();
}

// "Astérix" -> "asterix" : la recherche ignore accents et majuscules
function normaliser(texte) {
  return texte.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function afficherMessage(texte) {
  toast.textContent = texte;
  toast.classList.add("visible");

  setTimeout(function () {
    toast.classList.remove("visible");
  }, 2200);
}


// ===== Chargement des données =====

async function getBooks() {
  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error("Erreur lors du chargement des données");
    }

    books = await response.json();
    refreshUI();
  } catch (error) {
    console.log(error);
    bookList.innerHTML = `
      <div class="empty">
        Impossible de charger les données.<br />
        Vérifie que json-server tourne bien sur le port 4000.
      </div>
    `;
  }
}

// Recalcule tout ce qui dépend des filtres : la grille, les statistiques
// et le titre. Les statistiques portent donc sur la sélection affichée.
function applyFilters() {
  const selection = getFilteredBooks();

  renderBooks(selection);
  updateStats(selection);
  updateViewTitle();
}

function refreshUI() {
  applyFilters();
  updateCounts(books); // les compteurs du menu restent sur tout le catalogue
}


// ===== Filtres =====

function getFilteredBooks() {
  let filtered = [...books];

  if (filtreStatut === "dispo") {
    filtered = filtered.filter(function (book) {
      return book.disponible === true;
    });
  } else if (filtreStatut === "emprunte") {
    filtered = filtered.filter(function (book) {
      return book.disponible === false;
    });
  }

  if (filtreCategorie !== "all") {
    filtered = filtered.filter(function (book) {
      return book.categorie === filtreCategorie;
    });
  }

  if (recherche !== "") {
    filtered = filtered.filter(function (book) {
      return normaliser(book.titre).includes(recherche)
          || normaliser(book.auteur).includes(recherche);
    });
  }

  return filtered;
}


// ===== Affichage des livres =====

function renderBooks(bookArray) {
  bookList.innerHTML = "";

  if (bookArray.length === 0) {
    bookList.innerHTML = `<div class="empty">Aucun livre ne correspond à cette recherche.</div>`;
    return;
  }

  bookArray.forEach(function (book) {
    // classe de couleur de la catégorie, ex : "cat-roman"
    const classeCategorie = "cat-" + (CATEGORIES[book.categorie] || "roman");

    // La photo se pose par-dessus les initiales.
    // Si l'URL ne répond pas, onerror retire l'image et les initiales réapparaissent.
    let photo = "";
    if (book.image) {
      photo = `<img class="cover-img ${classeCategorie}" src="${book.image}"
                    alt="Couverture de ${book.titre}" onerror="this.remove()" />`;
    }

    // texte et style qui dépendent de la disponibilité
    let classeStatut = "status-emprunte";
    let texteStatut = "Emprunté";
    let classeBouton = "btn-vert";
    let texteBouton = "Retourner";

    if (book.disponible) {
      classeStatut = "status-dispo";
      texteStatut = "Disponible";
      classeBouton = "btn-orange";
      texteBouton = "Emprunter";
    }

    const card = document.createElement("div");
    card.className = "book-card";

    card.innerHTML = `
      <div class="cover ${classeCategorie}">
        <span class="cover-initials">${getInitiales(book.titre)}</span>
        ${photo}
      </div>

      <h3>${book.titre}</h3>
      <p class="book-author">${book.auteur}</p>

      <div class="book-meta">
        <span class="badge ${classeCategorie}">${book.categorie}</span>
        <span class="status ${classeStatut}">
          <span class="puce"></span>${texteStatut}
        </span>
      </div>

      <div class="book-actions">
        <button class="btn ${classeBouton}" data-action="toggle" data-id="${book.id}">
          ${texteBouton}
        </button>
        <button class="btn btn-gris" data-action="delete" data-id="${book.id}">
          Supprimer
        </button>
      </div>
    `;

    bookList.appendChild(card);
  });
}


// ===== Statistiques =====

function updateStats(bookArray) {
  const disponibles = bookArray.filter(function (b) {
    return b.disponible === true;
  });

  const empruntes = bookArray.filter(function (b) {
    return b.disponible === false;
  });

  const categories = new Set(bookArray.map(function (b) {
    return b.categorie;
  }));

  document.querySelector("#sTotal").textContent = bookArray.length;
  document.querySelector("#sAvailable").textContent = disponibles.length;
  document.querySelector("#sBorrowed").textContent = empruntes.length;
  document.querySelector("#sCategories").textContent = categories.size;
}

// met à jour le petit compteur affiché à droite d'un filtre du menu
function setCount(typeFiltre, valeur, nombre) {
  const compteur = document.querySelector(
    `[data-filtre="${typeFiltre}"][data-valeur="${valeur}"] .nav-count`
  );
  if (compteur) {
    compteur.textContent = nombre;
  }
}

function updateCounts(bookArray) {
  setCount("statut", "all", bookArray.length);

  setCount("statut", "dispo", bookArray.filter(function (b) {
    return b.disponible === true;
  }).length);

  setCount("statut", "emprunte", bookArray.filter(function (b) {
    return b.disponible === false;
  }).length);

  setCount("categorie", "all", bookArray.length);

  Object.keys(CATEGORIES).forEach(function (categorie) {
    const nombre = bookArray.filter(function (b) {
      return b.categorie === categorie;
    }).length;

    setCount("categorie", categorie, nombre);
  });
}

function updateViewTitle() {
  const parties = [];

  if (filtreCategorie !== "all") parties.push(filtreCategorie);
  if (filtreStatut === "dispo") parties.push("Disponibles");
  if (filtreStatut === "emprunte") parties.push("Empruntés");

  if (parties.length > 0) {
    viewTitle.textContent = parties.join(" · ");
  } else {
    viewTitle.textContent = "Tous les livres";
  }
}


// ===== Opérations sur l'API =====

async function addBook(event) {
  event.preventDefault();

  const titre = document.querySelector("#titre").value.trim();
  const auteur = document.querySelector("#auteur").value.trim();
  const image = document.querySelector("#image").value.trim();
  const categorie = categorieSelect.value;

  if (!titre || !auteur) return;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titre: titre,
        auteur: auteur,
        categorie: categorie,
        image: image,
        disponible: true,
      }),
    });

    if (!response.ok) {
      throw new Error("Erreur lors de l'ajout du livre");
    }

    closeModal();
    await getBooks();
    afficherMessage(`« ${titre} » a été ajouté.`);
  } catch (error) {
    console.log(error);
    afficherMessage("L'ajout a échoué.");
  }
}

async function toggleAvailability(id, disponibleActuel) {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ disponible: !disponibleActuel }),
    });

    if (!response.ok) {
      throw new Error("Erreur lors de la mise à jour");
    }

    await getBooks();
    afficherMessage(disponibleActuel ? "Livre emprunté." : "Livre retourné.");
  } catch (error) {
    console.log(error);
    afficherMessage("La mise à jour a échoué.");
  }
}

async function deleteBook(id) {
  if (!confirm("Supprimer ce livre du catalogue ?")) return;

  try {
    const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });

    if (!response.ok) {
      throw new Error("Erreur lors de la suppression");
    }

    await getBooks();
    afficherMessage("Livre supprimé.");
  } catch (error) {
    console.log(error);
    afficherMessage("La suppression a échoué.");
  }
}


// ===== Construction du menu des catégories au démarrage =====

function buildCategoryUI() {
  let html = `
    <button class="nav-item actif" data-filtre="categorie" data-valeur="all" title="Toutes">
      <span class="nav-dot dot-toutes"></span>
      <span class="nav-label">Toutes</span>
      <span class="nav-count"></span>
    </button>
  `;

  Object.keys(CATEGORIES).forEach(function (categorie) {
    const suffixe = CATEGORIES[categorie];

    html += `
      <button class="nav-item" data-filtre="categorie" data-valeur="${categorie}" title="${categorie}">
        <span class="nav-dot dot-${suffixe}"></span>
        <span class="nav-label">${categorie}</span>
        <span class="nav-count"></span>
      </button>
    `;

    // on remplit aussi la liste déroulante du formulaire
    categorieSelect.innerHTML += `<option value="${categorie}">${categorie}</option>`;
  });

  categoryNav.innerHTML = html;
}


// ===== Popup =====

function openModal() {
  overlay.classList.add("ouvert");
  document.querySelector("#titre").focus();
}

function closeModal() {
  overlay.classList.remove("ouvert");
  bookForm.reset();
}


// ===== Événements =====

// réduit ou déploie le menu de gauche
document.querySelector("#menuBtn").addEventListener("click", function () {
  app.classList.toggle("reduit");

  if (app.classList.contains("reduit")) {
    this.title = "Déployer le menu";
  } else {
    this.title = "Réduire le menu";
  }
});

document.querySelector("#addBtn").addEventListener("click", openModal);
document.querySelector("#closeBtn").addEventListener("click", closeModal);
document.querySelector("#cancelBtn").addEventListener("click", closeModal);
document.querySelector("#reloadBtn").addEventListener("click", getBooks);

bookForm.addEventListener("submit", addBook);

overlay.addEventListener("click", function (event) {
  if (event.target === overlay) closeModal();
});

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") closeModal();
});

searchInput.addEventListener("input", function () {
  recherche = normaliser(searchInput.value.trim());
  applyFilters();
});

// un seul écouteur pour tous les filtres du menu
document.querySelector(".sidebar").addEventListener("click", function (event) {
  const bouton = event.target.closest(".nav-item");
  if (!bouton) return;

  const typeFiltre = bouton.dataset.filtre;

  // on enlève la surbrillance des autres boutons du même groupe
  document.querySelectorAll(`[data-filtre="${typeFiltre}"]`).forEach(function (el) {
    el.classList.remove("actif");
  });
  bouton.classList.add("actif");

  if (typeFiltre === "statut") {
    filtreStatut = bouton.dataset.valeur;
  } else {
    filtreCategorie = bouton.dataset.valeur;
  }

  applyFilters();
});

// un seul écouteur pour les boutons de toutes les cartes
bookList.addEventListener("click", function (event) {
  const bouton = event.target.closest("button[data-action]");
  if (!bouton) return;

  const id = bouton.dataset.id;

  if (bouton.dataset.action === "delete") {
    deleteBook(id);
    return;
  }

  const book = books.find(function (b) {
    return String(b.id) === String(id);
  });

  if (book) {
    toggleAvailability(id, book.disponible);
  }
});

buildCategoryUI();
getBooks();