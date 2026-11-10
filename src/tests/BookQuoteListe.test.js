import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import BookQuoteList from '../components/BookQuoteList.vue'

const apiUrl = 'https://webtech-backend-eo0l.onrender.com/api/v1/quotes'

let wrapper
let fetchMock

function successfulResponse(data) {
    return {
        ok: true,
        json: async () => data,
    }
}

function displayedTitles() {
    return wrapper.findAll('article h2').map(item => item.text())
}

beforeEach(async () => {
    const quotes = [
        {
            id: 1,
            bookTitle: 'Alpha',
            passageText: 'Ein Text über Mut.',
            pageNumber: 30,
            category: 'ROMAN',
        },
        {
            id: 2,
            bookTitle: 'Beta',
            passageText: 'Ein Text über Hoffnung.',
            pageNumber: 10,
            category: 'SACHBUCH',
        },
    ]

    fetchMock = vi.fn().mockResolvedValue(successfulResponse(quotes))
    vi.stubGlobal('fetch', fetchMock)

    wrapper = mount(BookQuoteList)
    await flushPromises()
})

afterEach(() => {
    wrapper?.unmount()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
})

describe('Buchzitate', () => {
    it('lädt und zeigt vorhandene Zitate an', () => {
        expect(fetchMock).toHaveBeenCalledWith(apiUrl)
        expect(displayedTitles()).toEqual(['Alpha', 'Beta'])
        expect(wrapper.text()).toContain('Ein Text über Mut.')
        expect(wrapper.text()).toContain('2 von 2 Zitaten')
    })

    it('speichert ein neues Zitat und zeigt es an', async () => {
        const newQuote = {
            bookTitle: 'Gamma',
            passageText: 'Ein neues Zitat.',
            pageNumber: 25,
            category: 'ROMAN',
        }

        fetchMock.mockResolvedValueOnce(
            successfulResponse({ id: 3, ...newQuote }),
        )

        await wrapper.get('#bookTitle').setValue(newQuote.bookTitle)
        await wrapper.get('#passageText').setValue(newQuote.passageText)
        await wrapper.get('#pageNumber').setValue(newQuote.pageNumber)
        await wrapper.get('#category').setValue(newQuote.category)
        await wrapper.get('form').trigger('submit')
        await flushPromises()

        expect(fetchMock).toHaveBeenLastCalledWith(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newQuote),
        })

        expect(displayedTitles()).toEqual(['Alpha', 'Beta', 'Gamma'])
        expect(wrapper.get('#bookTitle').element.value).toBe('')
    })

    it('bearbeitet ein vorhandenes Zitat', async () => {
        const changedQuote = {
            bookTitle: 'Alpha',
            passageText: 'Der geänderte Text.',
            pageNumber: 30,
            category: 'ROMAN',
        }

        fetchMock.mockResolvedValueOnce(
            successfulResponse({ id: 1, ...changedQuote }),
        )

        const editButton = wrapper.findAll('article')[0].findAll('button')[0]
        await editButton.trigger('click')

        expect(wrapper.get('#bookTitle').element.value).toBe('Alpha')
        expect(wrapper.get('#passageText').element.value)
            .toBe('Ein Text über Mut.')

        await wrapper.get('#passageText').setValue(changedQuote.passageText)
        await wrapper.get('form').trigger('submit')
        await flushPromises()

        expect(fetchMock).toHaveBeenLastCalledWith(`${apiUrl}/1`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(changedQuote),
        })

        expect(wrapper.findAll('article')[0].text())
            .toContain('Der geänderte Text.')
        expect(wrapper.findAll('article')).toHaveLength(2)
    })

    it('löscht ein Zitat nach Bestätigung', async () => {
        const confirmMock = vi.spyOn(window, 'confirm').mockReturnValue(true)
        fetchMock.mockResolvedValueOnce({ ok: true })

        const deleteButton = wrapper.findAll('article')[0].findAll('button')[1]
        await deleteButton.trigger('click')
        await flushPromises()

        expect(confirmMock).toHaveBeenCalledTimes(1)
        expect(fetchMock).toHaveBeenLastCalledWith(`${apiUrl}/1`, {
            method: 'DELETE',
        })
        expect(displayedTitles()).toEqual(['Beta'])
    })

    it('sucht nach Buchtitel und Zitattext und zeigt leere Ergebnisse', async () => {
        await wrapper.get('#search').setValue('ALPHA')
        expect(displayedTitles()).toEqual(['Alpha'])

        await wrapper.get('#search').setValue('Hoffnung')
        expect(displayedTitles()).toEqual(['Beta'])

        await wrapper.get('#search').setValue('NichtVorhanden')
        expect(wrapper.findAll('article')).toHaveLength(0)
        expect(wrapper.text()).toContain('Keine passenden Zitate gefunden.')
    })

    it('filtert nach Kategorie und zeigt anschließend wieder alle Zitate', async () => {
        await wrapper.get('#categoryFilter').setValue('ROMAN')
        expect(displayedTitles()).toEqual(['Alpha'])

        await wrapper.get('#categoryFilter').setValue('')
        expect(displayedTitles()).toEqual(['Alpha', 'Beta'])
    })

    it('sortiert nach Titel und Seitenzahl in beide Richtungen', async () => {
        await wrapper.get('#sort').setValue('titleDesc')
        expect(displayedTitles()).toEqual(['Beta', 'Alpha'])

        await wrapper.get('#sort').setValue('titleAsc')
        expect(displayedTitles()).toEqual(['Alpha', 'Beta'])

        await wrapper.get('#sort').setValue('pageAsc')
        expect(displayedTitles()).toEqual(['Beta', 'Alpha'])

        await wrapper.get('#sort').setValue('pageDesc')
        expect(displayedTitles()).toEqual(['Alpha', 'Beta'])
    })
})