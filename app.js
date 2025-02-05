const apiUrl = "https://ldgames.x10.mx/Games.php";

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    fetchGames();
    loadCloudSources();
});

function setupEventListeners() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => switchPage(item.dataset.page));
    });

    document.getElementById('searchInput')?.addEventListener('input', debounce(searchGames, 500));
    
    document.getElementById('searchButton')?.addEventListener('click', performSearch);
}

function performSearch() {
    const searchTerm = document.getElementById('searchInput').value.trim();
    if (searchTerm) {
        searchGamesAndShowPage(searchTerm);
    }
}

function addCloudSource() {
    const cloudSourceInput = document.getElementById('cloudSourceInput');
    const sourceUrl = cloudSourceInput.value.trim();

    if (!sourceUrl) return;

    // Validate URL
    try {
        new URL(sourceUrl);
    } catch (error) {
        alert('URL inválida. Por favor, insira uma URL válida.');
        return;
    }

    const cloudSources = JSON.parse(localStorage.getItem('cloudSources') || '[]');
    
    if (cloudSources.includes(sourceUrl)) {
        alert('Esta fonte de nuvem já foi adicionada.');
        return;
    }

    cloudSources.push(sourceUrl);
    localStorage.setItem('cloudSources', JSON.stringify(cloudSources));

    renderCloudSources(cloudSources);
    cloudSourceInput.value = '';
}

function renderCloudSources(sources) {
    const cloudSourcesList = document.getElementById('cloudSourcesList');
    cloudSourcesList.innerHTML = '';

    sources.forEach((source, index) => {
        const sourceItem = document.createElement('div');
        sourceItem.className = 'cloud-source-item';
        sourceItem.innerHTML = `
            <span>${source}</span>
            <button onclick="removeCloudSource(${index})">
                <i class="fas fa-trash"></i>
            </button>
        `;
        cloudSourcesList.appendChild(sourceItem);
    });
}

function removeCloudSource(index) {
    const cloudSources = JSON.parse(localStorage.getItem('cloudSources') || '[]');
    cloudSources.splice(index, 1);
    localStorage.setItem('cloudSources', JSON.stringify(cloudSources));
    renderCloudSources(cloudSources);
}

function loadCloudSources() {
    const cloudSources = JSON.parse(localStorage.getItem('cloudSources') || '[]');
    renderCloudSources(cloudSources);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

async function fetchGames() {
    const genreContainer = document.getElementById("genreContainer");
    genreContainer.innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
        </div>
    `;

    try {
        const response = await fetch(`${apiUrl}?type=generos`);
        if (!response.ok) throw new Error("Erro na API");
        
        const games = await response.json();
        displayGames(games);
        setFeaturedGame(games);
    } catch (error) {
        genreContainer.innerHTML = `<div class="error">${error.message}</div>`;
    }
}

function setFeaturedGame(games) {
    const featuredGame = document.getElementById('featuredGame');
    const randomGame = games[Math.floor(Math.random() * games.length)];
    
    featuredGame.innerHTML = `
        <img src="${randomGame.banner_url || randomGame.image_url}" alt="${randomGame.title}">
    `;
    featuredGame.addEventListener('click', () => showGameDetails(randomGame));
}

function displayGames(games) {
    const genreContainer = document.getElementById("genreContainer");
    genreContainer.innerHTML = "";
    const genres = {};

    games.forEach(game => {
        const genre = game.genre || "Gênero Desconhecido";
        if (!genres[genre]) genres[genre] = [];
        genres[genre].push(game);
    });

    for (const [genre, genreGames] of Object.entries(genres)) {
        const genreSection = document.createElement("div");
        const genreTitle = document.createElement("h3");
        genreTitle.className = "genre-title";
        genreTitle.textContent = genre;
        
        const gamesRow = document.createElement("div");
        gamesRow.className = "games-row";
        
        genreGames.forEach(game => {
            const gameCard = document.createElement("div");
            gameCard.className = "game-card";
            gameCard.innerHTML = `
                <img src="${game.image_url || 'https://via.placeholder.com/150x200'}" alt="${game.title}">
                <div class="game-info">
                    <div class="game-title">${game.title}</div>
                </div>
            `;
            gameCard.addEventListener('click', () => showGameDetails(game));
            gamesRow.appendChild(gameCard);
        });

        genreSection.appendChild(genreTitle);
        genreSection.appendChild(gamesRow);
        genreContainer.appendChild(genreSection);
    }
}

async function searchGames(event) {
    const searchTerm = event.target.value.trim();
    const searchResults = document.getElementById('searchResults');
    
    if (searchTerm.length < 2) return;

    try {
        const response = await fetch(`${apiUrl}?name=${encodeURIComponent(searchTerm)}`);
        const games = await response.json();
        displaySearchResults(games);
    } catch (error) {
        console.error("Search error:", error);
    }
}

function switchPage(page) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    // Show selected page
    const targetPage = document.getElementById(`${page}Page`);
    if (targetPage) {
        targetPage.classList.add('active');
        
        // If switching to search page, focus on search input
        if (page === 'search') {
            document.getElementById('searchInput').focus();
        }
    }

    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.page === page);
    });
}

function showGameDetails(game) {
    const gameDetailsPage = document.getElementById('gameDetailsPage');
    const gameDetailsContent = document.getElementById('gameDetailsContent');
    const gameDetailsTitle = document.getElementById('gameDetailsTitle');

    gameDetailsTitle.textContent = game.title;

    let mediaItems = '';

    if (game.video_url) {
        mediaItems += `
            <div class="media-item">
                <iframe src="${game.video_url}" allowfullscreen></iframe>
            </div>
        `;
    }

    if (game.screenshots && game.screenshots.length > 0) {
        game.screenshots.forEach(screenshot => {
            mediaItems += `
                <div class="media-item">
                    <img src="${screenshot}" alt="Screenshot">
                </div>
            `;
        });
    }

    gameDetailsContent.innerHTML = `
        <img class="game-banner" src="${game.banner_url || game.image_url}" alt="${game.title}">
        <h1 class="game-title">${game.title}</h1>
        <div class="game-release-date">${game.release_date || 'Data não informada'}</div>
        <button class="download-button" onclick="handleCloudDownload('${game.title}')">Download</button>
        <div class="game-description">${game.description || 'Sem descrição disponível'}</div>
        <div class="media-section">
            ${mediaItems}
        </div>
    `;

    switchPage('gameDetails');
}

async function searchGamesAndShowPage(searchTerm) {
    try {
        const response = await fetch(`${apiUrl}?name=${encodeURIComponent(searchTerm)}`);
        const games = await response.json();
        
        // Switch to search page and display results
        switchPage('search');
        displaySearchResults(games);
    } catch (error) {
        console.error("Search error:", error);
    }
}

async function fetchDownloadLinksFromSources(gameTitle) {
    const cloudSources = JSON.parse(localStorage.getItem('cloudSources') || '[]');
    
    if (cloudSources.length === 0) {
        throw new Error('Nenhuma fonte de nuvem configurada');
    }

    // Normalize game title for better matching
    const normalizedGameTitle = normalizeString(gameTitle);

    // Use Promise.allSettled to handle multiple async requests
    const sourcePromises = cloudSources.map(async (sourceUrl) => {
        try {
            const response = await fetch(sourceUrl);
            
            // Add timeout to prevent hanging requests
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);  // 5 second timeout
            
            if (!response.ok) {
                throw new Error(`Erro na requisição: ${response.status}`);
            }
            
            const data = await response.json();
            clearTimeout(timeoutId);

            // Advanced fuzzy matching for game title
            const matchedDownloads = data.downloads.filter(download => {
                const normalizedDownloadTitle = normalizeString(download.title);
                return normalizedDownloadTitle.includes(normalizedGameTitle);
            });

            return {
                sourceName: data.name || new URL(sourceUrl).hostname,
                downloads: matchedDownloads.map(download => ({
                    title: download.title,
                    uris: download.uris,
                    fileSize: download.fileSize,
                    uploadDate: download.uploadDate
                }))
            };
        } catch (error) {
            console.error(`Erro ao buscar links de ${sourceUrl}:`, error);
            return null;
        }
    });

    // Wait for all promises to resolve
    const results = await Promise.allSettled(sourcePromises);
    
    // Filter out successful results and flatten downloads
    const validResults = results
        .filter(result => result.status === 'fulfilled' && result.value)
        .map(result => result.value)
        .filter(source => source.downloads.length > 0);

    return validResults;
}

// Helper function to normalize strings for better matching
function normalizeString(str) {
    if (!str) return '';
    return str
        .toLowerCase()                 // Convert to lowercase
        .normalize('NFD')              // Normalize accented characters
        .replace(/[\u0300-\u036f]/g, '') // Remove accent marks
        .replace(/[^a-z0-9]/g, ' ')    // Replace non-alphanumeric with space
        .replace(/\s+/g, ' ')          // Replace multiple spaces with single space
        .trim();                       // Remove leading/trailing spaces
}

function setupDownloadButtonLongPress() {
    document.getElementById('downloadSources').addEventListener('pointerdown', (e) => {
        const downloadButton = e.target.closest('.download-button');
        if (!downloadButton) return;

        let pressTimer;
        const longPressDuration = 500; // 500ms

        const startPress = () => {
            pressTimer = setTimeout(() => {
                showDownloadDetails(downloadButton);
            }, longPressDuration);
        };

        const cancelPress = () => {
            clearTimeout(pressTimer);
        };

        downloadButton.addEventListener('pointerdown', startPress);
        downloadButton.addEventListener('pointerup', cancelPress);
        downloadButton.addEventListener('pointerleave', cancelPress);
    });
}

function showDownloadDetails(button) {
    const downloadDetailDialog = document.getElementById('downloadDetailDialog');
    const downloadDetailInfo = document.getElementById('downloadDetailInfo');
    
    // Extract data attributes from the button
    const title = button.getAttribute('data-title');
    const fileSize = button.getAttribute('data-file-size');
    const uploadDate = button.getAttribute('data-upload-date');
    const sourceUrl = button.getAttribute('data-source-url');

    downloadDetailInfo.innerHTML = `
        <div class="download-detail-item">
            <strong>Título:</strong> ${title}
        </div>
        <div class="download-detail-item">
            <strong>Tamanho do Arquivo:</strong> ${fileSize}
        </div>
        <div class="download-detail-item">
            <strong>Data de Upload:</strong> ${formatDate(uploadDate)}
        </div>
        <div class="download-detail-item">
            <strong>Fonte Original:</strong> ${sourceUrl}
        </div>
    `;

    downloadDetailDialog.showModal();
}

function formatDate(dateString) {
    if (!dateString) return 'Data não disponível';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return dateString;
    }
}

function closeDownloadDetailDialog() {
    const downloadDetailDialog = document.getElementById('downloadDetailDialog');
    downloadDetailDialog.close();
}

async function handleCloudDownload(gameTitle) {
    try {
        // Show loading spinner
        const downloadDialog = document.getElementById('downloadDialog');
        const downloadTitle = document.getElementById('downloadGameTitle');
        const downloadSourcesContainer = document.getElementById('downloadSources');
        
        downloadTitle.textContent = gameTitle;
        downloadSourcesContainer.innerHTML = `
            <div class="loading">
                <div class="loading-spinner"></div>
                <p>Buscando links de download...</p>
            </div>
        `;

        downloadDialog.showModal();

        // Fetch download links from all sources
        const sourceResults = await fetchDownloadLinksFromSources(gameTitle);

        // If no download links found
        if (sourceResults.length === 0) {
            downloadSourcesContainer.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <p>Nenhum link de download encontrado para ${gameTitle}</p>
                </div>
            `;
            return;
        }

        // Render download sources
        const downloadLinksHTML = sourceResults.map(source => `
            <div class="download-source">
                <div class="source-details">
                    <span class="source-name">${source.sourceName}</span>
                    <span class="upload-date">${source.downloads[0].uploadDate || 'Data não informada'}</span>
                </div>
                <div class="download-links">
                    ${source.downloads.map(download => 
                        download.uris.map(uri => `
                            <a href="${uri}" 
                               class="download-button" 
                               target="_blank"
                               data-title="${download.title}"
                               data-file-size="${download.fileSize}"
                               data-upload-date="${download.uploadDate}"
                               data-source-url="${new URL(uri).hostname}"
                            >
                                Download (${download.fileSize})
                                <span class="download-site">${new URL(uri).hostname}</span>
                            </a>
                        `).join('')
                    ).join('')}
                </div>
            </div>
        `).join('');

        downloadSourcesContainer.innerHTML = downloadLinksHTML;
        
        // Setup long press event listeners
        setupDownloadButtonLongPress();

    } catch (error) {
        console.error('Erro ao buscar links de download:', error);
        const downloadSourcesContainer = document.getElementById('downloadSources');
        downloadSourcesContainer.innerHTML = `
            <div class="error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${error.message || 'Erro ao buscar links de download'}</p>
            </div>
        `;
    }
}

function displaySearchResults(games) {
    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.innerHTML = '';
    
    if (games.length === 0) {
        resultsContainer.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <p>Nenhum jogo encontrado</p>
            </div>
        `;
        return;
    }

    games.forEach(game => {
        const gameCard = document.createElement('div');
        gameCard.className = 'game-card';
        gameCard.innerHTML = `
            <img src="${game.image_url || 'https://via.placeholder.com/200x150?text=Sem+Imagem'}" alt="${game.title}">
            <div class="game-info">
                <div class="game-title">${game.title}</div>
                <div class="game-date">
                    <i class="far fa-calendar-alt"></i>
                    ${game.release_date || 'Data não informada'}
                </div>
            </div>
        `;
        gameCard.addEventListener('click', () => showGameDetails(game));
        resultsContainer.appendChild(gameCard);
    });
}

function showDownloadSettings() {
    const downloadSettingsDialog = document.getElementById('downloadSettingsDialog');
    downloadSettingsDialog.showModal();
}

function closeDownloadSettingsDialog() {
    const downloadSettingsDialog = document.getElementById('downloadSettingsDialog');
    downloadSettingsDialog.close();
}

function closeDownloadDialog() {
    const dialog = document.getElementById('downloadDialog');
    dialog.close();
}

function downloadSourceCode() {
    const sourceCodeUrl = 'https://github.com/DEYVIDYT/LdGamesCloud/archive/refs/heads/main.zip';
    window.open(sourceCodeUrl, '_blank');
}