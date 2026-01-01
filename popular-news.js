
// --- Popular Page Functions ---
async function loadPopularPage() {
    const popularContainer = document.getElementById('popular-container');
    if (!popularContainer) return;

    try {
        popularContainer.innerHTML = '<div class="loading-spinner"></div>';

        // Fetch top anime (most popular)
        const res = await fetch(`${API_URL}/top/anime?limit=25`);
        const data = await res.json();

        if (data.data && data.data.length > 0) {
            renderMovieGrid(data.data, popularContainer);
        } else {
            popularContainer.innerHTML = '<p class="no-results">No popular anime found.</p>';
        }
    } catch (error) {
        console.error('Error loading popular anime:', error);
        popularContainer.innerHTML = '<p class="error-message">Failed to load popular anime. Please try again later.</p>';
    }
}

// --- News Page Functions ---
async function loadNewsPage() {
    const newsContainer = document.getElementById('news-container');
    if (!newsContainer) return;

    try {
        newsContainer.innerHTML = '<div class="loading-spinner"></div>';

        // Create mock news data (since Jikan doesn't have a news endpoint in v4)
        const newsItems = [
            {
                id: 1,
                category: 'Announcement',
                title: 'New Anime Season Lineup Revealed',
                excerpt: 'The upcoming anime season brings exciting new series and highly anticipated sequels. From action-packed adventures to heartwarming slice-of-life stories, there\'s something for everyone.',
                image: 'https://cdn.myanimelist.net/images/anime/1208/94745l.jpg',
                date: '2 hours ago',
                author: 'AnimeSo Staff'
            },
            {
                id: 2,
                category: 'Update',
                title: 'Popular Series Gets New Movie Announcement',
                excerpt: 'Fans rejoice as the beloved anime series announces a new theatrical release. The movie promises to deliver an epic conclusion to the current story arc with stunning animation.',
                image: 'https://cdn.myanimelist.net/images/anime/1286/99889l.jpg',
                date: '5 hours ago',
                author: 'AnimeSo Staff'
            },
            {
                id: 3,
                category: 'News',
                title: 'Studio Announces Original Anime Project',
                excerpt: 'A renowned animation studio has revealed plans for an original anime series. The project features character designs by a famous manga artist and promises innovative storytelling.',
                image: 'https://cdn.myanimelist.net/images/anime/1223/96541l.jpg',
                date: '1 day ago',
                author: 'AnimeSo Staff'
            },
            {
                id: 4,
                category: 'Event',
                title: 'Anime Convention Dates Announced',
                excerpt: 'The biggest anime convention of the year has announced its dates and special guests. Attendees can look forward to exclusive screenings, panels, and merchandise.',
                image: 'https://cdn.myanimelist.net/images/anime/1337/99013l.jpg',
                date: '2 days ago',
                author: 'AnimeSo Staff'
            }
        ];

        renderNewsGrid(newsItems, newsContainer);
    } catch (error) {
        console.error('Error loading news:', error);
        newsContainer.innerHTML = '<p class="error-message">Failed to load news. Please try again later.</p>';
    }
}

function renderNewsGrid(newsItems, container) {
    container.innerHTML = '';

    newsItems.forEach(item => {
        const newsCard = document.createElement('div');
        newsCard.classList.add('news-item');
        newsCard.innerHTML = `
            <img src="${item.image}" alt="${item.title}" class="news-item__image">
            <div class="news-item__content">
                <span class="news-item__category">${item.category}</span>
                <h3 class="news-item__title">${item.title}</h3>
                <p class="news-item__excerpt">${item.excerpt}</p>
                <div class="news-item__meta">
                    <span><i class='bx bx-time'></i> ${item.date}</span>
                    <span><i class='bx bx-user'></i> ${item.author}</span>
                </div>
            </div>
        `;
        container.appendChild(newsCard);
    });
}

// Helper function to render movie grid (reusable)
function renderMovieGrid(movies, container) {
    container.innerHTML = '';

    movies.forEach(movie => {
        const card = document.createElement('div');
        card.classList.add('movie__card');
        const title = movie.title_english || movie.title;
        const score = movie.score || 'N/A';

        card.innerHTML = `
            <img src="${movie.images.jpg.large_image_url}" alt="${title}" class="movie__img">
            <div class="movie__content">
                <h3 class="movie__title">${title}</h3>
                <div class="movie__meta-info">
                    <i class='bx bxs-star' style="color:#ff60ad;"></i> ${score}
                </div>
            </div>
        `;

        card.onclick = () => openModal(movie);
        container.appendChild(card);
    });
}
