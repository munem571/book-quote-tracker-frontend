<script setup>
import { computed, onMounted, ref } from 'vue'

const apiUrl = 'https://webtech-backend-eo0l.onrender.com/api/v1/quotes'

const quotes = ref([])
const errorMessage = ref('')
const loading = ref(false)
const busy = ref(false)

const editingId = ref(null)
const bookTitle = ref('')
const passageText = ref('')
const pageNumber = ref(1)
const category = ref('')

const searchText = ref('')
const selectedCategory = ref('')
const sortBy = ref('titleAsc')

const categories = computed(() => {
  return [...new Set(quotes.value.map(quote => quote.category))]
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, 'de'))
})

const displayedQuotes = computed(() => {
  const search = searchText.value.trim().toLocaleLowerCase('de')

  const result = quotes.value.filter(quote => {
    const matchesSearch =
        (quote.bookTitle ?? '').toLocaleLowerCase('de').includes(search) ||
        (quote.passageText ?? '').toLocaleLowerCase('de').includes(search)

    const matchesCategory =
        selectedCategory.value === '' ||
        quote.category === selectedCategory.value

    return matchesSearch && matchesCategory
  })

  return result.sort((a, b) => {
    switch (sortBy.value) {
      case 'titleDesc':
        return (b.bookTitle ?? '').localeCompare(a.bookTitle ?? '', 'de')
      case 'pageAsc':
        return a.pageNumber - b.pageNumber
      case 'pageDesc':
        return b.pageNumber - a.pageNumber
      default:
        return (a.bookTitle ?? '').localeCompare(b.bookTitle ?? '', 'de')
    }
  })
})

async function fetchQuotes() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await fetch(apiUrl)

    if (!response.ok) {
      throw new Error('Zitate konnten nicht geladen werden.')
    }

    quotes.value = await response.json()
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    loading.value = false
  }
}

function resetForm() {
  editingId.value = null
  bookTitle.value = ''
  passageText.value = ''
  pageNumber.value = 1
  category.value = ''
}

function startEditing(quote) {
  editingId.value = quote.id
  bookTitle.value = quote.bookTitle
  passageText.value = quote.passageText
  pageNumber.value = quote.pageNumber
  category.value = quote.category
  errorMessage.value = ''

  document.getElementById('bookTitle')?.focus()
}

function resetInvalidCategory() {
  if (!categories.value.includes(selectedCategory.value)) {
    selectedCategory.value = ''
  }
}

async function saveQuote() {
  if (busy.value) return

  errorMessage.value = ''

  if (
      !bookTitle.value.trim() ||
      !passageText.value.trim() ||
      !category.value.trim()
  ) {
    errorMessage.value = 'Bitte alle Textfelder ausfüllen.'
    return
  }

  if (!Number.isInteger(pageNumber.value) || pageNumber.value < 1) {
    errorMessage.value = 'Bitte eine positive, ganze Seitenzahl eingeben.'
    return
  }

  busy.value = true

  const id = editingId.value
  const isEditing = id !== null

  try {
    const response = await fetch(
        isEditing ? `${apiUrl}/${id}` : apiUrl,
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            bookTitle: bookTitle.value.trim(),
            passageText: passageText.value.trim(),
            pageNumber: pageNumber.value,
            category: category.value.trim()
          })
        }
    )

    if (!response.ok) {
      throw new Error(
          response.status === 404
              ? 'Dieses Zitat existiert nicht mehr.'
              : 'Das Zitat konnte nicht gespeichert werden.'
      )
    }

    const savedQuote = await response.json()

    if (isEditing) {
      quotes.value = quotes.value.map(quote =>
          quote.id === id ? savedQuote : quote
      )
    } else {
      quotes.value.push(savedQuote)
    }

    resetInvalidCategory()
    resetForm()
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    busy.value = false
  }
}

async function deleteQuote(quote) {
  if (busy.value) return

  const confirmed = window.confirm(
      `Zitat aus „${quote.bookTitle}“ wirklich löschen?`
  )

  if (!confirmed) return

  busy.value = true
  errorMessage.value = ''

  try {
    const response = await fetch(`${apiUrl}/${quote.id}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      throw new Error('Das Zitat konnte nicht gelöscht werden.')
    }

    quotes.value = quotes.value.filter(item => item.id !== quote.id)

    if (editingId.value === quote.id) {
      resetForm()
    }

    resetInvalidCategory()
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    busy.value = false
  }
}

onMounted(fetchQuotes)
</script>

<template>
  <section class="library">
    <header class="topbar">
      <a class="brand" href="#">
        <span class="brand-icon" aria-hidden="true">❧</span>
        Lesespuren<span class="brand-dot">.</span>
      </a>

      <span class="topbar-note">DEIN PERSÖNLICHES ZITATARCHIV</span>

      <a class="nav-link" href="#collection">
        Meine Sammlung <span aria-hidden="true">↗</span>
      </a>
    </header>

    <div class="hero">
      <div class="hero-copy">
        <p class="eyebrow">
          <span></span>
          FÜR GEDANKEN, DIE BLEIBEN
        </p>

        <h1>
          Gute Bücher enden.<br>
          <em>Ihre Worte bleiben.</em>
        </h1>

        <p class="hero-description">
          Sammle die Zeilen, die dich bewegen. Und finde sie genau dann
          wieder, wenn du sie brauchst.
        </p>

        <div class="hero-stats">
          <span>
            <strong>{{ quotes.length }}</strong> gesammelte Zitate
          </span>
          <span>
            <strong>{{ categories.length }}</strong> Kategorien
          </span>
        </div>
      </div>

      <div class="hero-art" aria-hidden="true">
        <div class="orbit orbit-one"></div>
        <div class="orbit orbit-two"></div>
        <span class="art-star">✦</span>

        <div class="book book-cream">
          <span>WORTE, DIE BLEIBEN</span>
          <b>❧</b>
        </div>

        <div class="book book-green">
          <span>ZWISCHEN DEN ZEILEN</span>
          <i></i>
          <b>Lesespuren</b>
        </div>

        <span class="art-caption">
          Ein guter Gedanke verdient einen Platz.
        </span>
      </div>
    </div>

    <div class="workspace">
      <aside class="editor">
        <div class="panel-heading">
          <span class="step-icon" aria-hidden="true">＋</span>

          <div>
            <p class="eyebrow">FESTHALTEN STATT VERGESSEN</p>
            <h2>
              {{
                editingId !== null
                    ? 'Zitat bearbeiten'
                    : 'Neues Zitat hinzufügen'
              }}
            </h2>
          </div>
        </div>

        <p class="editor-description">
          Welche Zeile möchtest du bewahren?
        </p>

        <form @submit.prevent="saveQuote">
          <fieldset :disabled="busy || loading">
            <div class="field">
              <label for="bookTitle">Buchtitel</label>
              <input
                  id="bookTitle"
                  v-model="bookTitle"
                  maxlength="255"
                  placeholder="Aus welchem Buch stammt dein Zitat?"
                  required
              >
            </div>

            <div class="field">
              <label for="passageText">Zitat / Textstelle</label>
              <textarea
                  id="passageText"
                  v-model="passageText"
                  placeholder="Manche Worte möchte man nicht vergessen …"
                  required
              ></textarea>
            </div>

            <div class="field-row">
              <div class="field">
                <label for="pageNumber">Seitenzahl</label>
                <input
                    id="pageNumber"
                    v-model.number="pageNumber"
                    type="number"
                    min="1"
                    step="1"
                    required
                >
              </div>

              <div class="field">
                <label for="category">Kategorie</label>
                <input
                    id="category"
                    v-model="category"
                    maxlength="255"
                    placeholder="z. B. Roman"
                    required
                >
              </div>
            </div>

            <button class="primary-button" type="submit">
              {{
                busy
                    ? 'Bitte warten …'
                    : editingId !== null
                        ? 'Änderungen speichern'
                        : 'Zitat speichern'
              }}
              <span aria-hidden="true">↗</span>
            </button>

            <button
                v-if="editingId !== null"
                class="cancel-button"
                type="button"
                @click="resetForm"
            >
              Bearbeiten abbrechen
            </button>
          </fieldset>
        </form>

        <p class="editor-footnote">
          <span aria-hidden="true">❧</span>
          Ein kleiner Platz für große Gedanken.
        </p>
      </aside>

      <section
          id="collection"
          class="collection"
          aria-labelledby="collection-title"
      >
        <div class="collection-heading">
          <div>
            <p class="eyebrow">DEINE LITERARISCHE SCHATZKISTE</p>
            <h2 id="collection-title">
              Meine Sammlung
              <span class="count-badge">{{ quotes.length }}</span>
            </h2>
          </div>

          <span class="collection-decoration" aria-hidden="true">❧</span>
        </div>

        <div class="list-controls">
          <div class="field search-field">
            <label for="search">Suche nach Buchtitel oder Zitattext</label>
            <input
                id="search"
                v-model="searchText"
                type="search"
                placeholder="Worte oder Bücher wiederfinden …"
            >
          </div>

          <div class="filter-row">
            <div class="field">
              <label for="categoryFilter">Kategorie filtern</label>
              <select id="categoryFilter" v-model="selectedCategory">
                <option value="">Alle Kategorien</option>
                <option
                    v-for="item in categories"
                    :key="item"
                    :value="item"
                >
                  {{ item }}
                </option>
              </select>
            </div>

            <div class="field">
              <label for="sort">Sortieren nach</label>
              <select id="sort" v-model="sortBy">
                <option value="titleAsc">Buchtitel: A–Z</option>
                <option value="titleDesc">Buchtitel: Z–A</option>
                <option value="pageAsc">Seitenzahl: aufsteigend</option>
                <option value="pageDesc">Seitenzahl: absteigend</option>
              </select>
            </div>
          </div>
        </div>

        <p v-if="loading" class="status-message" role="status">
          Zitate werden geladen …
        </p>

        <template v-else>
          <p class="result-count" aria-live="polite">
            {{ displayedQuotes.length }} von {{ quotes.length }} Zitaten
          </p>

          <div v-if="quotes.length === 0" class="empty-state">
            <span aria-hidden="true">“</span>
            <h3>Deine Sammlung beginnt mit einer Zeile.</h3>
            <p>Noch keine Zitate vorhanden.</p>
            <p>Halte deinen ersten Lieblingssatz im Formular fest.</p>
          </div>

          <div
              v-else-if="displayedQuotes.length === 0"
              class="empty-state"
          >
            <h3>Keine passenden Zitate gefunden.</h3>
            <p>
              Versuche einen anderen Suchbegriff oder eine andere Kategorie.
            </p>
          </div>

          <div class="quote-list">
            <article
                v-for="quote in displayedQuotes"
                :key="quote.id"
                class="quote-card"
                :class="{ 'is-editing': editingId === quote.id }"
            >
              <div class="quote-topline">
                <span class="category-badge">{{ quote.category }}</span>
                <span class="page-label">Seite {{ quote.pageNumber }}</span>
              </div>

              <p class="quote-text">{{ quote.passageText }}</p>

              <div class="quote-bottom">
                <h2>{{ quote.bookTitle }}</h2>

                <div class="actions">
                  <button
                      type="button"
                      :disabled="busy"
                      @click="startEditing(quote)"
                  >
                    Bearbeiten
                  </button>

                  <button
                      class="delete-button"
                      type="button"
                      :disabled="busy"
                      @click="deleteQuote(quote)"
                  >
                    Löschen
                  </button>
                </div>
              </div>
            </article>
          </div>
        </template>
      </section>
    </div>

    <p v-if="errorMessage" class="error-message" role="alert">
      {{ errorMessage }}
    </p>

    <footer class="footer">
      <span class="footer-brand">Lesespuren.</span>
      <span>Deine Bücher. Deine Gedanken. Dein Archiv.</span>
      <a href="#">Zurück nach oben ↑</a>
    </footer>
  </section>
</template>