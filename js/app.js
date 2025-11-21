// Aplicación principal
class DinamicaApp {
    constructor() {
        this.settings = this.loadSettings();
        this.currentComunidad = null;
    }

    init() {
        this.bindEvents();
        this.updateUI();
        this.loadInitialData();
    }

    bindEvents() {
        // Navegación entre pestañas
        $('.nav-link[data-toggle="tab"]').on('show.bs.tab', (e) => {
            const target = $(e.target).attr('href');
            this.handleTabChange(target);
        });

        // Configuración
        $('#settings-form').on('submit', (e) => {
            e.preventDefault();
            this.saveSettings();
        });

        // Exportar/Importar
        $('#export-btn').on('click', () => this.exportData());
        $('#import-btn').on('click', () => this.importData());
        $('#reset-data-btn').on('click', () => this.resetData());

        // Notificaciones
        this.setupNotifications();
    }

    handleTabChange(tabId) {
        const tabTitles = {
            '#tab-rueda': 'Rueda de Selección',
            '#tab-comunidades': 'Gestión de Comunidades',
            '#tab-participantes': 'Gestión de Participantes',
            '#tab-configuracion': 'Configuración',
            '#tab-estadisticas': 'Estadísticas'
        };

        const breadcrumbs = {
            '#tab-rueda': 'Rueda',
            '#tab-comunidades': 'Comunidades',
            '#tab-participantes': 'Participantes',
            '#tab-configuracion': 'Configuración',
            '#tab-estadisticas': 'Estadísticas'
        };

        $('#page-title').text(tabTitles[tabId] || 'Panel de Control');
        $('#breadcrumb-active').text(breadcrumbs[tabId] || 'Inicio');

        // Manejo especial para la pestaña de estadísticas
        if (tabId === '#tab-estadisticas') {
            setTimeout(() => {
                if (typeof StatisticsManager !== 'undefined' && StatisticsManager.renderChart) {
                    StatisticsManager.renderChart();
                }
            }, 300);
        }
    }

    loadSettings() {
        const defaultSettings = {
            professorName: 'Profesor',
            spinDuration: 4,
            soundEnabled: true,
            textToSpeech: true,
            selectionCount: 5
        };

        const saved = localStorage.getItem('dinamica-settings');
        return saved ? {...defaultSettings, ...JSON.parse(saved)} : defaultSettings;
    }

    saveSettings() {
        this.settings = {
            professorName: $('#professor-name-input').val(),
            spinDuration: parseInt($('#spin-duration').val()),
            soundEnabled: $('#sound-enabled').val() === 'true',
            textToSpeech: $('#text-to-speech').val() === 'true',
            selectionCount: parseInt($('#selection-count').val())
        };

        localStorage.setItem('dinamica-settings', JSON.stringify(this.settings));
        this.showNotification('Configuración guardada correctamente', 'success');
        this.updateUI();
    }

    updateUI() {
        $('#professor-name').text(this.settings.professorName);
        $('#professor-name-input').val(this.settings.professorName);
        $('#spin-duration').val(this.settings.spinDuration);
        $('#sound-enabled').val(this.settings.soundEnabled.toString());
        $('#text-to-speech').val(this.settings.textToSpeech.toString());
        $('#selection-count').val(this.settings.selectionCount);
    }

    exportData() {
        const data = {
            settings: this.settings,
            communities: CommunitiesManager.getCommunities(),
            participants: ParticipantsManager.getParticipants(),
            statistics: StatisticsManager.getStats()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dinamica-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showNotification('Datos exportados correctamente', 'success');
    }

    importData() {
        const fileInput = $('#import-file')[0];
        if (!fileInput.files.length) {
            this.showNotification('Selecciona un archivo para importar', 'warning');
            return;
        }

        const file = fileInput.files[0];
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.settings) {
                    localStorage.setItem('dinamica-settings', JSON.stringify(data.settings));
                    this.settings = data.settings;
                }
                
                if (data.communities) {
                    localStorage.setItem('dinamica-communities', JSON.stringify(data.communities));
                }
                
                if (data.participants) {
                    localStorage.setItem('dinamica-participants', JSON.stringify(data.participants));
                }
                
                if (data.statistics) {
                    localStorage.setItem('dinamica-statistics', JSON.stringify(data.statistics));
                }

                this.showNotification('Datos importados correctamente', 'success');
                location.reload();
            } catch (error) {
                this.showNotification('Error al importar el archivo', 'error');
                console.error('Import error:', error);
            }
        };

        reader.readAsText(file);
    }

    resetData() {
        if (confirm('¿Estás seguro de que quieres restablecer todos los datos? Esta acción no se puede deshacer.')) {
            localStorage.removeItem('dinamica-settings');
            localStorage.removeItem('dinamica-communities');
            localStorage.removeItem('dinamica-participants');
            localStorage.removeItem('dinamica-statistics');
            this.showNotification('Datos restablecidos correctamente', 'success');
            location.reload();
        }
    }

    setupNotifications() {
        // Sistema de notificaciones
        setInterval(() => {
            const count = Math.floor(Math.random() * 3);
            $('#notification-count').text(count);
        }, 30000);
    }

    showNotification(message, type = 'info') {
        // Implementación básica de notificación
        const alertClass = {
            'success': 'alert-success',
            'error': 'alert-danger',
            'warning': 'alert-warning',
            'info': 'alert-info'
        }[type] || 'alert-info';

        const alert = $(`
            <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
        `);
        
        $('.content-header').after(alert);
        
        setTimeout(() => {
            alert.alert('close');
        }, 3000);
    }

    // En la clase DinamicaApp, modificar loadInitialData:
loadInitialData() {
    console.log('Cargando datos iniciales...');
    
    // Cargar comunidades primero
    CommunitiesManager.loadCommunities();
    console.log('Comunidades cargadas:', CommunitiesManager.getCommunities().length);
    
    // Esperar un poco y cargar participantes
    setTimeout(() => {
        ParticipantsManager.loadParticipants();
        console.log('Participantes cargados:', ParticipantsManager.getParticipants().length);
        
        // Cargar estadísticas
        StatisticsManager.loadStats();
        console.log('Estadísticas cargadas');
        
        // Inicializar la rueda después de cargar participantes
        setTimeout(() => {
            if (typeof WheelManager !== 'undefined') {
                window.wheelManager = new WheelManager();
                console.log('Rueda inicializada');
            }
        }, 100);
    }, 200);
}
}

// Inicializar la aplicación después de que todo esté listo
$(document).ready(() => {
    window.app = new DinamicaApp();
    app.init();
}); 