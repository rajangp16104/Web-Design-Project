class LinkItem {
    constructor(id, url, title, color, fav) {
        this.id = id
        this.url = url
        this.title = title
        this.color = color
        this.fav = !!fav
    }
}

const inputUrl = document.querySelector('.input-url')
const inputTitle = document.querySelector('.input-title')
const selectColor = document.querySelector('.select-color')
const btnSave = document.querySelector('.btn-save')
const linksList = document.getElementById('linksList')
const emptyMsg = document.getElementById('emptyMsg')
const inputSearch = document.querySelector('.input-search')
const btnExport = document.querySelector('.btn-export')
const btnImport = document.querySelector('.btn-import')
const btnClear = document.querySelector('.btn-clear')
const importModal = document.getElementById('importModal')
const importArea = document.querySelector('.import-area')
const modalClose = document.querySelector('.modal-close')
const modalCancel = document.querySelector('.modal-cancel')
const modalDoImport = document.querySelector('.modal-do-import')

let items = []

function save() {
    localStorage.setItem('sm_links', JSON.stringify(items))
}

function load() {
    const raw = localStorage.getItem('sm_links')
    if (!raw) return
    try {
        const parsed = JSON.parse(raw)
        items = parsed.map(p => new LinkItem(p.id, p.url, p.title, p.color, p.fav))
    } catch (e) {
        items = []
    }
}

function hostFromUrl(u) {
    try {
        const url = new URL(u)
        return url.hostname.replace('www.', '')
    } catch (e) {
        return u
    }
}

function normalizeUrl(u) {
    if (!u) return ''
    if (!/^https?:\/\//i.test(u)) return 'https://' + u
    return u
}

function createCard(item) {
    const wrapper = document.createElement('div')
    wrapper.className = 'link-card'
    wrapper.style.background = item.color
    if (item.fav) wrapper.classList.add('favorite')
    const left = document.createElement('div')
    left.className = 'link-left'
    const title = document.createElement('div')
    title.className = 'link-title'
    title.textContent = item.title || hostFromUrl(item.url)
    const url = document.createElement('a')
    url.className = 'link-url'
    url.href = item.url
    url.target = '_blank'
    url.rel = 'noopener'
    url.textContent = item.url
    const meta = document.createElement('div')
    meta.className = 'link-meta'
    meta.textContent = hostFromUrl(item.url)
    left.appendChild(title)
    left.appendChild(url)
    left.appendChild(meta)
    const actions = document.createElement('div')
    actions.className = 'card-actions'
    const btnStar = document.createElement('button')
    btnStar.className = 'icon-btn icon-star'
    btnStar.innerHTML = item.fav ? '★' : '☆'
    btnStar.title = 'Toggle favorite'
    btnStar.addEventListener('click', () => {
        item.fav = !item.fav
        save()
        render()
    })
    const btnTrash = document.createElement('button')
    btnTrash.className = 'icon-btn icon-trash'
    btnTrash.innerHTML = '🗑️'
    btnTrash.title = 'Delete link'
    btnTrash.addEventListener('click', () => {
        items = items.filter(i => i.id !== item.id)
        save()
        render()
    })
    actions.appendChild(btnStar)
    actions.appendChild(btnTrash)
    wrapper.appendChild(left)
    wrapper.appendChild(actions)
    return wrapper
}

function render() {
    const q = (inputSearch.value || '').toLowerCase().trim()
    linksList.innerHTML = ''
    const sorted = [...items].sort((a, b) => {
        if (a.fav === b.fav) return (a.title || '').toLowerCase().localeCompare((b.title || '').toLowerCase())
        return a.fav ? -1 : 1
    })
    const filtered = sorted.filter(i => {
        if (!q) return true
        return (i.title || '').toLowerCase().includes(q) || (i.url || '').toLowerCase().includes(q)
    })
    if (filtered.length === 0) {
        emptyMsg.style.display = 'block'
    } else {
        emptyMsg.style.display = 'none'
    }
    filtered.forEach(i => {
        const node = createCard(i)
        linksList.appendChild(node)
    })
}

btnSave.addEventListener('click', () => {
    const raw = inputUrl.value.trim()
    if (!raw) return alert('Enter a URL')
    const url = normalizeUrl(raw)
    const title = inputTitle.value.trim()
    const color = selectColor.value
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
    const item = new LinkItem(id, url, title, color, false)
    items.push(item)
    inputUrl.value = ''
    inputTitle.value = ''
    save()
    render()
})

inputSearch.addEventListener('input', () => render())

btnExport.addEventListener('click', () => {
    const data = JSON.stringify(items, null, 2)
    const w = window.open('', '_blank')
    w.document.open()
    w.document.write('<pre>' + escapeHtml(data) + '</pre>')
    w.document.close()
})

btnImport.addEventListener('click', () => {
    importArea.value = ''
    showModal(true)
})

modalClose.addEventListener('click', () => showModal(false))
modalCancel.addEventListener('click', () => showModal(false))

modalDoImport.addEventListener('click', () => {
    try {
        const raw = importArea.value.trim()
        if (!raw) throw new Error('Empty')
        const parsed = JSON.parse(raw)
        const incoming = parsed.map(p => new LinkItem(Date.now().toString(36) + Math.random().toString(36).slice(2, 6), p.url, p.title, p.color, p.fav))
        items = items.concat(incoming)
        save()
        render()
        showModal(false)
    } catch (e) {
        alert('Invalid JSON')
    }
})

btnClear.addEventListener('click', () => {
    if (!confirm('Clear all saved links?')) return
    items = []
    save()
    render()
})

function showModal(flag) {
    if (flag) importModal.classList.add('show')
    else importModal.classList.remove('show')
}

function escapeHtml(s) {
    return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

load()
render()
