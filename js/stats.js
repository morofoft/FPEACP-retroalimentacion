// Gestión de estadísticas
class StatisticsManager {
    static stats = {
        totalSessions: 0,
        totalSelections: 0,
        sessionHistory: [],
        participantStats: {},
        communityStats: {}
    };

    static chartInstance = null;

    static loadStats() {
        const saved = localStorage.getItem('dinamica-statistics');
        if (saved) {
            this.stats = JSON.parse(saved);
        }
        this.updateStatsUI();
        this.renderChart();
    }

    static saveStats() {
        localStorage.setItem('dinamica-statistics', JSON.stringify(this.stats));
    }

    static getStats() {
        return this.stats;
    }

    static recordSelection(participantName) {
        this.stats.totalSelections++;
        
        // Registrar estadísticas del participante
        if (!this.stats.participantStats[participantName]) {
            this.stats.participantStats[participantName] = 0;
        }
        this.stats.participantStats[participantName]++;
        
        this.saveStats();
        this.updateStatsUI();
        
        // Actualizar el gráfico si está visible
        if ($('#tab-estadisticas').hasClass('active')) {
            this.updateChart();
        }
    }

    static recordSession() {
        this.stats.totalSessions++;
        this.stats.sessionHistory.push({
            date: new Date().toISOString(),
            selections: this.stats.totalSelections
        });
        
        // Mantener solo los últimos 30 días de historial
        if (this.stats.sessionHistory.length > 30) {
            this.stats.sessionHistory = this.stats.sessionHistory.slice(-30);
        }
        
        this.saveStats();
        this.updateStatsUI();
    }

    static updateStatsUI() {
        $('#total-participants').text(ParticipantsManager.getParticipants().length);
        $('#total-sessions').text(this.stats.totalSessions);
        $('#total-selections').text(this.stats.totalSelections);
    }

    static renderChart() {
        const ctx = document.getElementById('stats-chart').getContext('2d');
        
        // Destruir instancia anterior si existe
        if (this.chartInstance) {
            this.chartInstance.destroy();
        }

        // Datos reales basados en las estadísticas
        const chartData = this.prepareChartData();

        const config = {
            type: 'bar',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Cantidad'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Días'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    title: {
                        display: true,
                        text: 'Actividad de Selecciones'
                    }
                }
            }
        };

        this.chartInstance = new Chart(ctx, config);
    }

    static prepareChartData() {
        // Obtener datos de los últimos 7 días
        const last7Days = this.getLast7Days();
        const dailySelections = this.getDailySelectionCounts();
        
        const labels = last7Days.map(day => {
            const date = new Date(day);
            return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
        });

        const data = last7Days.map(day => dailySelections[day] || 0);

        return {
            labels: labels,
            datasets: [{
                label: 'Selecciones por día',
                data: data,
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        };
    }

    static getLast7Days() {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            days.push(date.toISOString().split('T')[0]);
        }
        return days;
    }

    static getDailySelectionCounts() {
        const counts = {};
        
        // Contar selecciones por día
        Object.values(this.stats.sessionHistory).forEach(session => {
            if (session.date) {
                const day = session.date.split('T')[0];
                counts[day] = (counts[day] || 0) + (session.selections || 0);
            }
        });

        return counts;
    }

    static updateChart() {
        if (this.chartInstance) {
            const newData = this.prepareChartData();
            this.chartInstance.data.labels = newData.labels;
            this.chartInstance.data.datasets[0].data = newData.data;
            this.chartInstance.update();
        }
    }

    static getTopParticipants(limit = 5) {
        const participants = Object.entries(this.stats.participantStats)
            .sort(([,a], [,b]) => b - a)
            .slice(0, limit)
            .map(([name, count]) => ({ name, count }));
        
        return participants;
    }

    static getSessionHistory(days = 7) {
        return this.stats.sessionHistory.slice(-days);
    }

    static resetStats() {
        this.stats = {
            totalSessions: 0,
            totalSelections: 0,
            sessionHistory: [],
            participantStats: {},
            communityStats: {}
        };
        this.saveStats();
        this.updateStatsUI();
        
        if (this.chartInstance) {
            this.chartInstance.destroy();
            this.chartInstance = null;
        }
        this.renderChart();
    }

    // Método para limpiar el gráfico cuando se cambia de pestaña
    static destroyChart() {
        if (this.chartInstance) {
            this.chartInstance.destroy();
            this.chartInstance = null;
        }
    }
}

// Inicializar estadísticas
$(document).ready(() => {
    StatisticsManager.loadStats();
    
    // Registrar sesión cuando se inicia la aplicación
    StatisticsManager.recordSession();

    // Manejar cambios de pestaña para el gráfico
    $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
        const target = $(e.target).attr('href');
        
        if (target === '#tab-estadisticas') {
            // Cuando se activa la pestaña de estadísticas, renderizar el gráfico
            setTimeout(() => {
                StatisticsManager.renderChart();
            }, 100);
        } else if (StatisticsManager.chartInstance) {
            // Cuando se cambia a otra pestaña, destruir el gráfico para liberar memoria
            StatisticsManager.destroyChart();
        }
    });

    // Renderizar gráfico si la pestaña de estadísticas está activa al cargar
    if ($('#tab-estadisticas').hasClass('active')) {
        setTimeout(() => {
            StatisticsManager.renderChart();
        }, 500);
    }
});