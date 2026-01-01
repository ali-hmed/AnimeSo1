// --- Jikan API Configuration ---
const API_URL = 'https://api.jikan.moe/v4';

// --- DOM Elements ---
const heroContent = document.getElementById('hero-content');
const trendingContainer = document.getElementById('trending-container');
const searchResultsContainer = document.getElementById('search-results-container');
const searchTitle = document.getElementById('search-title');
const modal = document.getElementById('movie-modal');
const modalBody = document.getElementById('modal-body');
const modalClose = document.getElementById('modal-close');

// Buttons
const prevBtn = document.getElementById('hero-prev');
const nextBtn = document.getElementById('hero-next');

const heroPagination = document.getElementById('hero-pagination');

// --- Global State ---
let heroMovies = [];
let currentHeroIndex = 0;
let heroInterval;

// --- Logic ---

function init() {
    setupEventListeners();

    const searchGrid = document.getElementById('search-results-container');
    const homeGrid = document.getElementById('trending-container');

    if (searchGrid) {
        loadSearchPage();
    } else if (homeGrid) {
        loadHomePage();
    }
}

function setupEventListeners() {
    if (modalClose) {
        modalClose.addEventListener('click', () => {
            modal.classList.remove('active-modal');
            modalBody.innerHTML = ''; // Clear video/content
        });
    }

    // Close on outside click
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active-modal');
            modalBody.innerHTML = '';
        }
    });

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            nextHero();
            resetSlideshowTimer();
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            prevHero();
            resetSlideshowTimer();
        });
    }

    const sidebar = document.getElementById('sidebar-mobile');
    const navToggle = document.getElementById('nav-toggle');
    const sidebarClose = document.getElementById('sidebar-close');

    if (navToggle && sidebar) {
        navToggle.addEventListener('click', () => {
            sidebar.classList.add('active');
        });
    }

    if (sidebarClose && sidebar) {
        sidebarClose.addEventListener('click', () => {
            sidebar.classList.remove('active');
        });
    }

    const mobileSearchTrigger = document.getElementById('mobile-search-trigger');
    const mobileSearchBtn = document.getElementById('mobile-search-btn');
    const searchInput = document.getElementById('search-input');

    if ((mobileSearchTrigger || mobileSearchBtn) && searchInput) {
        const trigger = mobileSearchTrigger || mobileSearchBtn;
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            searchInput.focus();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

async function loadHomePage() {
    try {
        // 1. Hero & Trending (Top Anime)
        // We fetch top anime and use them for both hero and trending row
        const topRes = await fetch(`${API_URL}/top/anime?filter=bypopularity&limit=10`);
        const topData = await topRes.json();

        heroMovies = topData.data || [];
        if (heroMovies.length > 0) {
            renderHeroPagination();
            setHero(heroMovies[0], 1); // Hero shows rank #1 initially
            startHeroSlideshow();
        }
        renderTrending(topData.data, trendingContainer);

        // SEQUENTIAL LOADING with small delays to avoid 429 Rate Limit (Jikan limit: 3/sec)
        // 2. Main content sections
        const latestContainer = document.getElementById('latest-episodes-container');
        if (latestContainer) {
            setTimeout(() => fetchCategory(`${API_URL}/seasons/now?limit=12`, latestContainer), 500);
        }

        const newContainer = document.getElementById('new-on-hianime-container');
        if (newContainer) {
            setTimeout(() => fetchCategory(`${API_URL}/top/anime?filter=upcoming&limit=12`, newContainer), 1000);
        }

        // 3. Top Lists (Left Column)
        const topAnimeList = document.getElementById('top-anime-list');
        if (topAnimeList) {
            setTimeout(() => fetchListGroup(`${API_URL}/top/anime?type=tv&limit=5`, topAnimeList), 1500);
        }

        const mostPopularList = document.getElementById('most-popular-list');
        if (mostPopularList) {
            setTimeout(() => fetchListGroup(`${API_URL}/top/anime?filter=bypopularity&limit=5`, mostPopularList), 2000);
        }

        const mostFavoriteList = document.getElementById('most-favorite-list');
        if (mostFavoriteList) {
            setTimeout(() => fetchListGroup(`${API_URL}/top/anime?filter=favorite&limit=5`, mostFavoriteList), 2500);
        }

        const completedList = document.getElementById('latest-completed-list');
        if (completedList) {
            setTimeout(() => fetchListGroup(`${API_URL}/top/anime?status=complete&limit=5`, completedList), 3000);
        }

        // 4. Sidebar (Top 10)
        const sidebarList = document.getElementById('top-10-list');
        if (sidebarList) {
            setTimeout(() => fetchSidebarList(`${API_URL}/top/anime?limit=10`, sidebarList), 3500);
        }

    } catch (error) {
        console.error('Error loading home page:', error);
    }
}

async function loadSearchPage() {
    const params = new URLSearchParams(window.location.search);
    const query = params.get('q');
    const resultsCount = document.getElementById('results-count');

    if (!query) {
        if (searchTitle) searchTitle.textContent = 'Please enter a search term';
        if (searchResultsContainer) searchResultsContainer.innerHTML = '';
        if (resultsCount) resultsCount.textContent = '0 results';
        return;
    }

    if (searchTitle) searchTitle.textContent = query;

    try {
        const res = await fetch(`${API_URL}/anime?q=${query}&limit=24`);
        const data = await res.json();

        if (resultsCount) resultsCount.textContent = `${data.pagination.items.total || 0} results`;

        if (!data.data || data.data.length === 0) {
            if (searchResultsContainer) searchResultsContainer.innerHTML = '<p>No results found.</p>';
            return;
        }

        renderMovies(data.data, searchResultsContainer);
    } catch (error) {
        console.error('Error searching:', error);
        if (searchResultsContainer) searchResultsContainer.innerHTML = '<p>Error loading results.</p>';
    }
}

async function fetchCategory(url, container) {
    try {
        await new Promise(r => setTimeout(r, 600)); // Rate limit buffer
        const res = await fetch(url);
        const data = await res.json();
        renderMovies(data.data, container);
    } catch (error) {
        console.error('Error fetching category:', error);
    }
}

async function fetchListGroup(url, container) {
    try {
        const res = await fetch(url);
        const data = await res.json();
        renderListGroup(data.data, container);
    } catch (e) { console.error(e); }
}

async function fetchSidebarList(url, container) {
    try {
        const res = await fetch(url);
        const data = await res.json();
        renderSidebarList(data.data, container);
    } catch (e) { console.error(e); }
}

// --- Slideshow ---

function renderHeroPagination() {
    if (!heroPagination) return;
    heroPagination.innerHTML = '';
    heroMovies.forEach((_, index) => {
        const dot = document.createElement('span');
        dot.classList.add('hero__dot');
        if (index === 0) dot.classList.add('active');
        dot.addEventListener('click', () => {
            goToHero(index);
            resetSlideshowTimer();
        });
        heroPagination.appendChild(dot);
    });
}

function goToHero(index) {
    currentHeroIndex = index;
    setHero(heroMovies[index], index + 1);
}

function nextHero() {
    if (heroMovies.length === 0) return;
    currentHeroIndex++;
    if (currentHeroIndex >= heroMovies.length) {
        currentHeroIndex = 0;
    }
    setHero(heroMovies[currentHeroIndex], currentHeroIndex + 1);
}

function prevHero() {
    if (heroMovies.length === 0) return;
    (currentHeroIndex === 0) ? currentHeroIndex = heroMovies.length - 1 : currentHeroIndex--;
    setHero(heroMovies[currentHeroIndex], currentHeroIndex + 1);
}

function resetSlideshowTimer() {
    clearInterval(heroInterval);
    heroInterval = setInterval(() => {
        nextHero();
    }, 5000);
}

function startHeroSlideshow() {
    if (heroInterval) clearInterval(heroInterval);
    heroInterval = setInterval(() => {
        nextHero();
    }, 5000);
}

function setHero(movie, rank = 1) {
    if (!heroContent) return;
    // Fade out first
    heroContent.style.opacity = 0;

    // Update Dots
    if (heroPagination) {
        const dots = heroPagination.querySelectorAll('.hero__dot');
        dots.forEach((dot, index) => {
            if (index === rank - 1) dot.classList.add('active');
            else dot.classList.remove('active');
        });
    }

    setTimeout(() => {
        let backgroundImg = movie.images.jpg.large_image_url;
        if (movie.trailer && movie.trailer.images && movie.trailer.images.maximum_image_url) {
            backgroundImg = movie.trailer.images.maximum_image_url;
        }

        const title = movie.title_english || movie.title;
        const type = movie.type || 'TV';
        const duration = movie.duration || '24m';
        const date = movie.aired ? (movie.aired.string.split(' to')[0]) : 'Recent';

        const heroHTML = `
            <img src="${backgroundImg}" alt="" class="hero-bg">
            <div class="hero-gradient-overlay"></div>
            <div class="home__data">
                <div class="hero__spotlight">#${rank} Spotlight</div>
                <h1 class="home__title">${title}</h1>
                <div class="hero__meta-row">
                    <span class="meta-item"><i class='bx bxs-right-arrow' style="font-size: 0.7rem; color: #ff60ad;"></i> ${type}</span>
                    <span class="meta-item"><i class='bx bxs-time'></i> ${duration}</span>
                    <span class="meta-item"><i class='bx bxs-calendar'></i> ${date}</span>
                    <span class="meta-badge">HD</span>
                </div>
                <p class="home__description">${movie.synopsis ? movie.synopsis.slice(0, 180) + '...' : 'No description available.'}</p>
                <div class="home__buttons">
                    <a href="#" class="button hero__button-watch" onclick="openModalById(${movie.mal_id}); return false;">
                        <i class='bx bx-play'></i> Watch Now
                    </a>
                    <a href="#" class="button button--ghost" onclick="openModalById(${movie.mal_id}); return false;">
                        Detail <i class='bx bx-chevron-right'></i>
                    </a>
                </div>
            </div>
        `;
        heroContent.innerHTML = heroHTML;

        // Fade in
        heroContent.style.opacity = 1;
    }, 500);
}

// --- Render Functions ---

function renderTrending(movies, container) {
    if (!container) return;
    container.innerHTML = '';
    movies.forEach((movie, index) => {
        const item = document.createElement('div');
        item.classList.add('trending__item');
        item.innerHTML = `
            <img src="${movie.images.jpg.large_image_url}" class="trending__img">
            <span class="trending__number">${(index + 1).toString().padStart(2, '0')}</span>
            <div class="trending__content">
                <h3 class="trending__title">${movie.title_english || movie.title}</h3>
            </div>
        `;
        item.onclick = () => openModal(movie);
        container.appendChild(item);
    });
}

function renderListGroup(movies, container) {
    if (!container) return;
    container.innerHTML = '';
    movies.forEach(movie => {
        const item = document.createElement('div');
        item.classList.add('list__item');
        item.innerHTML = `
            <img src="${movie.images.jpg.small_image_url}" class="list__item-img">
            <h4 class="list__item-title">${movie.title_english || movie.title}</h4>
        `;
        item.onclick = () => openModal(movie);
        container.appendChild(item);
    });
}

function renderSidebarList(movies, container) {
    if (!container) return;
    container.innerHTML = '';
    movies.forEach((movie, index) => {
        const item = document.createElement('div');
        item.classList.add('sidebar__list-item');
        const title = movie.title_english || movie.title;
        item.innerHTML = `
            <span class="sidebar__number">${(index + 1).toString().padStart(2, '0')}</span>
            <img src="${movie.images.jpg.small_image_url}" style="width:40px;height:55px;object-fit:cover;border-radius:2px;">
            <div class="sidebar__info">
                <p class="list__item-title" style="font-size:0.8rem;">${title}</p>
                <div class="movie__meta-info" style="font-size:0.7rem;">
                    <i class='bx bxs-star' style="color:#ff60ad;"></i> ${movie.score || 'N/A'}
                </div>
            </div>
        `;
        item.onclick = () => openModal(movie);
        container.appendChild(item);
    });
}

function renderMovies(movies, container) {
    if (!container) return;
    container.innerHTML = '';

    movies.forEach(movie => {
        const movieCard = document.createElement('div');
        movieCard.classList.add('movie__card');

        const title = movie.title_english || movie.title;
        const episodes = movie.episodes || '?';
        const type = movie.type || 'TV';
        const duration = movie.duration || '?';
        const image = movie.images.jpg.large_image_url;

        movieCard.innerHTML = `
            <div class="movie__poster-wrapper" style="position:relative; overflow:hidden; border-radius:inherit;">
                <img src="${image}" alt="${title}" class="movie__img">
                <div class="movie__badge">
                    <span class="badge-item ep">CC: ${episodes}</span>
                    <span class="badge-item sub"><i class='bx bx-microphone'></i> ${episodes}</span>
                </div>
            </div>
            <div class="movie__content">
                <h3 class="movie__title">${title}</h3>
                <div class="movie__meta-info">
                    <span>${type}</span> • <span>${duration.split(' ')[0]}m</span>
                </div>
            </div>
        `;

        movieCard.addEventListener('click', () => openModal(movie));
        container.appendChild(movieCard);
    });
}

// --- Modal Logic ---

function openModal(movie) {
    if (!modal || !modalBody) return;

    const title = movie.title_english || movie.title;
    const synopsis = movie.synopsis || 'No description available.';
    const image = movie.images.jpg.large_image_url;
    const episodes = movie.episodes || 'N/A';
    const score = movie.score || 'N/A';
    const status = movie.status || 'N/A';

    // Check for trailer
    let trailerHTML = '';
    if (movie.trailer && movie.trailer.embed_url) {
        trailerHTML = `
            <div class="modal__trailer">
                <iframe src="${movie.trailer.embed_url}" frameborder="0" allowfullscreen></iframe>
            </div>
        `;
    }

    const modalHTML = `
        <div class="modal__content">
            <span class="modal__close" id="modal-close-inner">&times;</span>
            <img src="${image}" alt="${title}" class="modal__img">
            <div class="modal__info">
                <h2 class="modal__title">${title}</h2>
                <div class="modal__meta">
                    <span class="modal__tag">Episodes: ${episodes}</span>
                    <span class="modal__tag">Score: ${score}</span>
                    <span class="modal__tag">Status: ${status}</span>
                </div>
                <p class="modal__desc">${synopsis}</p>
                ${trailerHTML}
            </div>
        </div>
    `;

    modalBody.innerHTML = modalHTML;
    modal.classList.add('active-modal');

    // Setup close button inside modal
    const innerClose = document.getElementById('modal-close-inner');
    if (innerClose) {
        innerClose.onclick = () => {
            modal.classList.remove('active-modal');
            modalBody.innerHTML = '';
        };
    }
}

async function openModalById(id) {
    try {
        const res = await fetch(`${API_URL}/anime/${id}`);
        const data = await res.json();
        openModal(data.data);
    } catch (e) {
        console.error('Error opening modal by ID:', e);
    }
}

// Start Application
init();
