// share.js
document.addEventListener('DOMContentLoaded', () => {
    handleSharePage();
});

async function handleSharePage() {
    const urlParams = new URLSearchParams(window.location.search);
    const gameName = urlParams.get('game');
    
    if (gameName) {
        try {
            const gameDetails = await fetchGameDetailsByName(gameName);
            if (gameDetails) {
                displaySharedGame(gameDetails);
            } else {
                showGameNotFoundError();
            }
        } catch (error) {
            console.error('Error fetching game details:', error);
            showGameNotFoundError();
        }
    }
}

async function fetchGameDetailsByName(gameName) {
    try {
        const apiUrl = "https://ldgames.x10.mx/Games.php";
        const response = await fetch(`${apiUrl}?name=${encodeURIComponent(gameName)}`);
        
        if (!response.ok) {
            throw new Error('Game not found');
        }
        
        const games = await response.json();
        return games.length > 0 ? games[0] : null;
    } catch (error) {
        console.error('Error fetching game details:', error);
        return null;
    }
}

function displaySharedGame(game) {
    // Similar to existing displaySharedGame function, but integrated with the new sharing mechanism
    const gameDetailsPage = document.getElementById('gameDetailsPage');
    const gameDetailsContent = document.getElementById('gameDetailsContent');
    const gameDetailsTitle = document.getElementById('gameDetailsTitle');

    gameDetailsTitle.textContent = game.title;

    let mediaItems = '';

    if (game.video_url) {
        const videoId = extractYouTubeVideoId(game.video_url);
        
        if (videoId) {
            mediaItems += `
                <div class="media-item video-container">
                    <div id="youtube-player"></div>
                </div>
            `;
        }
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

    // Load YouTube player if video is available
    if (game.video_url) {
        const videoId = extractYouTubeVideoId(game.video_url);
        if (videoId) {
            loadYouTubePlayer(videoId);
        }
    }

    switchPage('gameDetails');
}

function showGameNotFoundError() {
    const gameDetailsPage = document.getElementById('gameDetailsPage');
    const gameDetailsContent = document.getElementById('gameDetailsContent');
    
    gameDetailsContent.innerHTML = `
        <div class="error">
            <i class="fas fa-exclamation-triangle"></i>
            <h2>Jogo não encontrado</h2>
            <p>O jogo que você está tentando acessar não foi encontrado.</p>
        </div>
    `;

    switchPage('gameDetails');
}

async function shareGame(game) {
    try {
        // New sharing mechanism using URL parameters
        const baseUrl = 'https://deyvidyt.github.io/LdGamesCloud/index.html';
        const shareUrl = `${baseUrl}?game=${encodeURIComponent(game.title)}`;

        if (navigator.share) {
            await navigator.share({
                title: `Compartilhar ${game.title}`,
                text: `Confira o jogo ${game.title} no LdGames`,
                url: shareUrl
            });
        } else {
            copyToClipboard(shareUrl);
            alert('Link de compartilhamento copiado para a área de transferência');
        }
    } catch (error) {
        console.error('Erro ao compartilhar jogo:', error);
        alert('Não foi possível compartilhar o jogo');
    }
}

function extractYouTubeVideoId(url) {
    // Various YouTube URL formats
    const patterns = [
        /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            return match[1];
        }
    }
    return null;
}

function loadYouTubePlayer(videoId) {
    // Load YouTube IFrame Player API
    if (typeof YT === 'undefined' || !YT.loaded) {
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

        window.onYouTubeIframeAPIReady = () => {
            createYouTubePlayer(videoId);
        };
    } else {
        createYouTubePlayer(videoId);
    }
}

function createYouTubePlayer(videoId) {
    const currentYouTubePlayer = new YT.Player('youtube-player', {
        height: '360',
        width: '100%',
        videoId: videoId,
        playerVars: {
            'playsinline': 1
        }
    });
}

function switchPage(page) {
    // Destroy YouTube player if leaving game details page
    if (document.getElementById('gameDetailsPage').classList.contains('active')) {
        const youtubePlayer = document.getElementById('youtube-player');
        if (youtubePlayer) {
            const iframe = youtubePlayer.querySelector('iframe');
            if (iframe) {
                const iframeSrc = iframe.src;
                iframe.src = iframeSrc;
            }
        }
    }

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

function copyToClipboard(text) {
    const tempInput = document.createElement('input');
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
}

function handleCloudDownload(gameTitle) {
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
    const cloudSources = JSON.parse(localStorage.getItem('cloudSources') || '[]');
    
    if (cloudSources.length === 0) {
        downloadSourcesContainer.innerHTML = `
            <div class="error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Nenhuma fonte de nuvem configurada</p>
            </div>
        `;
        return;
    }

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
                return normalizedDownloadTitle.includes(normalizeString(gameTitle));
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
    const results = Promise.allSettled(sourcePromises);
    
    results.then(results => {
        const validResults = results
            .filter(result => result.status === 'fulfilled' && result.value)
            .map(result => result.value)
            .filter(source => source.downloads.length > 0);

        if (validResults.length === 0) {
            downloadSourcesContainer.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <p>Nenhum link de download encontrado para ${gameTitle}</p>
                </div>
            `;
            return;
        }

        // Render download sources
        const downloadLinksHTML = validResults.map(source => `
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
    });
}

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