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

// Kategorien aus den vorhandenen Zitaten ermitteln.
const categories = computed(() => {
  return [...new Set(quotes.value.map(quote => quote.category))]
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, 'de'))
})

// Suche, Filter und Sortierung gemeinsam anwenden.
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
  <section>
    <h1>Meine Buchzitate</h1>

    <form @submit.prevent="saveQuote">
      <h2>
        {{ editingId !== null ? 'Zitat bearbeiten' : 'Neues Zitat hinzufügen' }}
      </h2>

      <fieldset :disabled="busy || loading">
        <label for="bookTitle">Buchtitel</label>
        <input
            id="bookTitle"
            v-model="bookTitle"
            maxlength="255"
            required
        />

        <label for="passageText">Zitat / Textstelle</label>
        <textarea
            id="passageText"
            v-model="passageText"
            required
        ></textarea>

        <label for="pageNumber">Seitenzahl</label>
        <input
            id="pageNumber"
            v-model.number="pageNumber"
            type="number"
            min="1"
            step="1"
            required
        />

        <label for="category">Kategorie</label>
        <input
            id="category"
            v-model="category"
            maxlength="255"
            required
        />

        <button type="submit">
          {{
            busy
                ? 'Bitte warten …'
                : editingId !== null
                    ? 'Änderungen speichern'
                    : 'Zitat speichern'
          }}
        </button>

        <button
            v-if="editingId !== null"
            type="button"
            @click="resetForm"
        >
          Bearbeiten abbrechen
        </button>
      </fieldset>
    </form>

    <p v-if="errorMessage" role="alert">
      {{ errorMessage }}
    </p>

    <div class="list-controls">
      <label for="search">Suche nach Buchtitel oder Zitattext</label>
      <input
          id="search"
          v-model="searchText"
          type="search"
          placeholder="Suchbegriff eingeben"
      />

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

      <label for="sort">Sortieren nach</label>
      <select id="sort" v-model="sortBy">
        <option value="titleAsc">Buchtitel: A–Z</option>
        <option value="titleDesc">Buchtitel: Z–A</option>
        <option value="pageAsc">Seitenzahl: aufsteigend</option>
        <option value="pageDesc">Seitenzahl: absteigend</option>
      </select>
    </div>

    <p v-if="loading">Zitate werden geladen …</p>

    <template v-else>
      <p>{{ displayedQuotes.length }} von {{ quotes.length }} Zitaten</p>

      <p v-if="quotes.length === 0">
        Noch keine Zitate vorhanden.
      </p>
      <p v-else-if="displayedQuotes.length === 0">
        Keine passenden Zitate gefunden.
      </p>

      <article v-for="quote in displayedQuotes" :key="quote.id">
        <h2>{{ quote.bookTitle }}</h2>
        <p>{{ quote.passageText }}</p>
        <p>Seite {{ quote.pageNumber }} · {{ quote.category }}</p>

        <div class="actions">
          <button
              type="button"
              :disabled="busy"
              @click="startEditing(quote)"
          >
            Bearbeiten
          </button>

          <button
              type="button"
              :disabled="busy"
              @click="deleteQuote(quote)"
          >
            Löschen
          </button>
        </div>
      </article>
    </template>
  </section>
</template>

<style scoped>
form {
  margin: 24px 0;
}

fieldset,
.list-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

fieldset {
  border: none;
  padding: 0;
  margin: 0;
  min-width: 0;
}

input,
textarea,
select,
button {
  padding: 10px;
  font: inherit;
}

textarea {
  min-height: 100px;
}

button {
  cursor: pointer;
}

button:disabled {
  cursor: wait;
}

article {
  border: 1px solid #888;
  border-radius: 8px;
  padding: 16px;
  margin-top: 16px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

[role="alert"] {
  color: #e66;
}
</style>