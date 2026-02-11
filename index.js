// Пошук авто
function filterCars() {
    const term = document.getElementById('searchBar').value.toLowerCase();
    const cards = document.querySelectorAll('.card');

    cards.forEach(card => {
        const name = card.getAttribute('data-name').toLowerCase();
        if (name.includes(term)) {
            card.style.display = "block";
        } else {
            card.style.display = "none";
        }
    });
}

// Сортування авто
function sortCars() {
    const option = document.getElementById('sortOption').value;
    const grid = document.getElementById('carGrid');
    const cards = Array.from(grid.querySelectorAll('.card'));

    // Якщо кнопка "Додати авто" знаходиться в сітці, запам'ятаємо її позицію
    const addBtn = document.getElementById('addBtn');
    let addBtnIndex = -1;
    if (addBtn && addBtn.parentElement === grid) {
        const children = Array.from(grid.children);
        addBtnIndex = children.indexOf(addBtn);
        // тимчасово видаляємо кнопку з DOM, щоб сортування торкалося лише карток
        grid.removeChild(addBtn);
    }

    if (option === 'default') return;

    cards.sort((a, b) => {
        const priceA = parseFloat(a.getAttribute('data-price'));
        const priceB = parseFloat(b.getAttribute('data-price'));
        const nameA = a.getAttribute('data-name');
        const nameB = b.getAttribute('data-name');

        if (option === 'priceLow') return priceA - priceB;
        if (option === 'priceHigh') return priceB - priceA;
        if (option === 'nameAZ') return nameA.localeCompare(nameB);
    });

    cards.forEach(card => grid.appendChild(card));

    // Повертаємо кнопку на попередню позицію (якщо вона була в сітці)
    if (addBtn) {
        const childrenAfter = Array.from(grid.children);
        if (addBtnIndex >= 0 && addBtnIndex <= childrenAfter.length) {
            const ref = childrenAfter[addBtnIndex] || null;
            if (ref) grid.insertBefore(addBtn, ref);
            else grid.appendChild(addBtn);
        } else {
            grid.appendChild(addBtn);
        }
    }
}

// Поточний рік для футера
document.getElementById('footerYear').textContent = new Date().getFullYear();

// Local storage keys
const STORAGE_KEY = 'storedCars';
const CART_KEY = 'cartItems';

let editingCard = null;

function openModal() {
    editingCard = null;
    document.getElementById('modalTitle').innerText = "Додати автомобіль";
    document.getElementById('modalName').value = "";
    document.getElementById('modalPrice').value = "";
    document.getElementById('modalImg').value = "";
    const modal = document.getElementById('modal');
    const content = modal.querySelector('.modal-content');
    if (content) content.classList.add('large');
    modal.style.display = "flex";
}

function closeModal() {
    const modal = document.getElementById('modal');
    const content = modal.querySelector('.modal-content');
    if (content) content.classList.remove('large');
    modal.style.display = "none";
}

function openEditModal(btn) {
    editingCard = btn.closest('.card');
    document.getElementById('modalTitle').innerText = "Редагувати дані";
    document.getElementById('modalName').value = editingCard.getAttribute('data-name');
    document.getElementById('modalPrice').value = editingCard.getAttribute('data-price');
    document.getElementById('modalImg').value = editingCard.querySelector('img').src;
    const modal = document.getElementById('modal');
    const content = modal.querySelector('.modal-content');
    if (content) content.classList.remove('large');
    modal.style.display = "flex";
}

function saveCar() {
    const name = document.getElementById('modalName').value;
    const price = document.getElementById('modalPrice').value;
    const img = document.getElementById('modalImg').value;

    if (!name || !price || !img) return alert("Будь ласка, заповніть усі поля");

    if (editingCard) {
        // Редагування
        editingCard.setAttribute('data-name', name);
        editingCard.setAttribute('data-price', price);
        editingCard.querySelector('h3').innerText = name;
        editingCard.querySelector('.price').innerText = "$" + Number(price).toLocaleString();
        editingCard.querySelector('img').src = img;

        // Якщо це збережена картка — оновити localStorage
        const id = editingCard.getAttribute('data-id');
        if (id) {
            const stored = loadStoredCars();
            const idx = stored.findIndex(c => c.id === id);
            if (idx > -1) {
                stored[idx].name = name;
                stored[idx].price = price;
                stored[idx].img = img;
                saveStoredCars(stored);
            }
        }
    } else {
        // Додавання нової картки — зберігаємо в localStorage
        const grid = document.getElementById('carGrid');
        const id = String(Date.now()) + String(Math.floor(Math.random()*1000));
        const carObj = { id, name, price, img };
        const newCard = createCardElement(carObj, true);
        grid.appendChild(newCard);

        // Перемістити кнопку "Додати авто" одразу після нової картки
        const addBtn = document.getElementById('addBtn');
        if (addBtn) {
            // Якщо кнопка вже є в DOM, вставляємо її після нової картки
            if (newCard.nextSibling) grid.insertBefore(addBtn, newCard.nextSibling);
            else grid.appendChild(addBtn);
        }

        const stored = loadStoredCars();
        stored.push(carObj);
        saveStoredCars(stored);
    }
    attachCardControls();
    closeModal();
}

// Create DOM element for a car object
function createCardElement(car, isStored = false) {
    const div = document.createElement('div');
    div.className = 'card';
    div.setAttribute('data-name', car.name);
    div.setAttribute('data-price', car.price);
    if (isStored) {
        div.setAttribute('data-id', car.id);
        div.setAttribute('data-stored', 'true');
    }
    div.innerHTML = `
        <div class="card-controls">
            <button class="edit-btn">✎</button>
            <button class="delete-btn">✕</button>
        </div>
        <img src="${car.img}" alt="${car.name}">
        <h3>${car.name}</h3>
        <div class="price">$${Number(car.price).toLocaleString()}</div>
    `;
    return div;
}

function deleteCard(btn) {
    const card = btn.closest('.card');
    if (!card) return;
    const id = card.getAttribute('data-id');
    if (id) {
        let stored = loadStoredCars();
        stored = stored.filter(c => c.id !== id);
        saveStoredCars(stored);
    }
    card.remove();
}

// Stored cars helpers
function loadStoredCars() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
}

function saveStoredCars(arr) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

// Cart helpers
function loadCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch(e){ return []; }
}

function saveCart(cart) { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }

function addToCartFromCard(card) {
    const name = card.getAttribute('data-name');
    const price = Number(card.getAttribute('data-price'));
    const img = card.querySelector('img')?.src || '';
    const cart = loadCart();
    const existing = cart.find(i => i.name === name && i.price == price);
    if (existing) existing.qty = (existing.qty || 1) + 1;
    else cart.push({ id: String(Date.now())+Math.random(), name, price, img, qty: 1 });
    saveCart(cart);
    renderCart();
}

function renderCart() {
    const cart = loadCart();
    const container = document.getElementById('cartItems');
    const totalEl = document.getElementById('cartTotal');
    const countEl = document.getElementById('cartCount');
    container.innerHTML = '';
    let total = 0; let count = 0;
    cart.forEach(item => {
        const row = document.createElement('div');
        row.className = 'cart-item';
        row.innerHTML = `
            <img src="${item.img}" alt="${item.name}">
            <div class="meta">
                <div style="font-weight:600">${item.name}</div>
                <div>$${Number(item.price).toLocaleString()} × ${item.qty}</div>
            </div>
            <button class="remove">✕</button>
        `;
        row.querySelector('.remove').addEventListener('click', () => {
            removeFromCart(item.id);
        });
        container.appendChild(row);
        total += Number(item.price) * (item.qty || 1);
        count += item.qty || 1;
    });
    totalEl.textContent = `$${Number(total).toLocaleString()}`;
    countEl.textContent = count;
}

function removeFromCart(id) {
    let cart = loadCart();
    cart = cart.filter(i => i.id !== id);
    saveCart(cart);
    renderCart();
}

function clearCart() { saveCart([]); renderCart(); }

function checkout() { alert('Оформлення замовлення тимчасово недоступне.'); }

function toggleCart() {
    const panel = document.getElementById('cartPanel');
    panel.classList.toggle('open');
}

// Attach control buttons to existing and newly created cards
function attachCardControls() {
    const grid = document.getElementById('carGrid');
    grid.querySelectorAll('.card').forEach(card => {
        // edit button
        const editBtn = card.querySelector('.edit-btn');
        if (editBtn) { editBtn.onclick = function(){ openEditModal(this); }; }
        // delete button
        const delBtn = card.querySelector('.delete-btn');
        if (delBtn) { delBtn.onclick = function(){ deleteCard(this); }; }
        // add to cart button (only once)
        if (!card.querySelector('.add-to-cart')) {
            const btn = document.createElement('button');
            btn.className = 'btn add-to-cart';
            btn.textContent = 'В кошик';
            btn.style.marginTop = '8px';
            btn.onclick = function(){ addToCartFromCard(card); };
            card.appendChild(btn);
        }
    });
}

// On load: render stored cars and attach controls
document.addEventListener('DOMContentLoaded', () => {
    const stored = loadStoredCars();
    const grid = document.getElementById('carGrid');
    stored.forEach(car => {
        const el = createCardElement(car, true);
        grid.appendChild(el);
    });
    // Перемістити кнопку "Додати авто" після всіх завантажених карток
    const addBtn = document.getElementById('addBtn');
    if (addBtn) grid.appendChild(addBtn);
    attachCardControls();
    renderCart();
});

