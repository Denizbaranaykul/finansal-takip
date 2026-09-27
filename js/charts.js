/**
 * ===================================================================
 * FİNANSAL TAKİP - GRAFİK YÖNETİMİ (charts.js)
 * ===================================================================
 * Chart.js kütüphanesi ile Harcama Kategori Doughnut Grafiği ve
 * Aylık Gelir & Gider Karşılaştırması Çift Çubuk Grafiği.
 */

// Kategori Renk Eşleşmeleri
export const CATEGORY_COLORS = {
  // Gider Kategorileri
  'Market': '#10b981',
  'Dışardan Yemek': '#f97316',
  'Dışarıdan Yemek': '#f97316',
  'Yurt Ücreti': '#0ea5e9',
  'Ulaşım': '#f59e0b',
  'Fatura & Aidat': '#0ea5e9',
  'Sağlık & Bakım': '#ec4899',
  'Eğlence & Sosyal': '#8b5cf6',
  'Eğitim': '#14b8a6',
  'Giyim & Alışveriş': '#f43f5e',
  'Diğer Gider': '#64748b',

  // Geriye Dönük Uyumluluk (Eski Kayıtlar İçin)
  'Market & Gıda': '#10b981',
  'Kira & Konut': '#0ea5e9',
  'Ulaşım & Yakıt': '#f59e0b',

  // Gelir Kategorileri
  'Maaş': '#10b981',
  'Ek Gelir': '#3b82f6',
  'Yatırım & Temettü': '#8b5cf6',
  'Kira Geliri': '#f59e0b',
  'Satış & Ticaret': '#06b6d4',
  'Diğer Gelir': '#64748b'
};

const DEFAULT_COLOR_PALETTE = [
  '#10b981', '#14b8a6', '#0ea5e9', '#3b82f6', '#f59e0b',
  '#f97316', '#f43f5e', '#ec4899', '#84cc16', '#64748b'
];

let categoryChartInstance = null;
let trendChartInstance = null;

/**
 * Harcama Kategori Dağılım Grafiğini günceller
 */
export function updateCategoryChart(transactions) {
  const canvas = document.getElementById('expenseCategoryChart');
  const emptyState = document.getElementById('doughnutEmptyState');
  const countTag = document.getElementById('expenseChartCountTag');

  if (!canvas) return;

  // Sadece harcamaları filtrele
  const expenses = transactions.filter(t => t.type === 'expense');

  if (expenses.length === 0) {
    if (emptyState) emptyState.classList.remove('hidden');
    if (countTag) countTag.textContent = '0 Kategori';
    if (categoryChartInstance) {
      categoryChartInstance.destroy();
      categoryChartInstance = null;
    }
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');

  // Kategorilere göre topla
  const categoryTotals = {};
  let totalExpense = 0;

  expenses.forEach(t => {
    const cat = t.category || 'Diğer Gider';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(t.amount);
    totalExpense += Number(t.amount);
  });

  const labels = Object.keys(categoryTotals);
  const data = Object.values(categoryTotals);
  const backgroundColors = labels.map((cat, idx) => CATEGORY_COLORS[cat] || DEFAULT_COLOR_PALETTE[idx % DEFAULT_COLOR_PALETTE.length]);

  if (countTag) {
    countTag.textContent = `${labels.length} Kategori`;
  }

  if (categoryChartInstance) {
    categoryChartInstance.data.labels = labels;
    categoryChartInstance.data.datasets[0].data = data;
    categoryChartInstance.data.datasets[0].backgroundColor = backgroundColors;
    categoryChartInstance.update();
  } else {
    categoryChartInstance = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: backgroundColors,
          borderWidth: 2,
          borderColor: '#111827',
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#94a3b8',
              font: {
                family: "'Plus Jakarta Sans', sans-serif",
                size: 11
              },
              boxWidth: 12,
              boxHeight: 12,
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 12
            }
          },
          tooltip: {
            backgroundColor: '#1e293b',
            titleColor: '#f8fafc',
            bodyColor: '#cbd5e1',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            padding: 10,
            displayColors: true,
            callbacks: {
              label: function(context) {
                const value = context.parsed;
                const percentage = totalExpense > 0 ? ((value / totalExpense) * 100).toFixed(1) : 0;
                return ` ${context.label}: ₺${value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} (%${percentage})`;
              }
            }
          }
        }
      }
    });
  }
}

/**
 * Son 6 aylık Gelir & Gider Trend Bar Grafiğini günceller
 */
export function updateMonthlyTrendChart(allTransactions) {
  const canvas = document.getElementById('monthlyTrendChart');
  if (!canvas) return;

  // Son 6 ayın etiketlerini üret (örn: Nis, May, Haz, Tem, Ağu, Eyl)
  const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  const monthsData = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;
    monthsData.push({ key, label, income: 0, expense: 0 });
  }

  // İşlemleri ilgili aylara dağıt
  allTransactions.forEach(t => {
    if (!t.date) return;
    const itemMonthKey = t.date.slice(0, 7); // "YYYY-MM"
    const monthObj = monthsData.find(m => m.key === itemMonthKey);
    if (monthObj) {
      if (t.type === 'income') {
        monthObj.income += Number(t.amount);
      } else {
        monthObj.expense += Number(t.amount);
      }
    }
  });

  const labels = monthsData.map(m => m.label);
  const incomeValues = monthsData.map(m => m.income);
  const expenseValues = monthsData.map(m => m.expense);

  if (trendChartInstance) {
    trendChartInstance.data.labels = labels;
    trendChartInstance.data.datasets[0].data = incomeValues;
    trendChartInstance.data.datasets[1].data = expenseValues;
    trendChartInstance.update();
  } else {
    trendChartInstance = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Gelir',
            data: incomeValues,
            backgroundColor: '#10b981',
            borderRadius: 6,
            barPercentage: 0.7,
            categoryPercentage: 0.6
          },
          {
            label: 'Gider',
            data: expenseValues,
            backgroundColor: '#f43f5e',
            borderRadius: 6,
            barPercentage: 0.7,
            categoryPercentage: 0.6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            display: false // Navbar üstünde özel buton göstergeleri var
          },
          tooltip: {
            backgroundColor: '#1e293b',
            titleColor: '#f8fafc',
            bodyColor: '#cbd5e1',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            padding: 10,
            callbacks: {
              label: function(context) {
                return ` ${context.dataset.label}: ₺${context.parsed.y.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#94a3b8',
              font: {
                family: "'Plus Jakarta Sans', sans-serif",
                size: 11
              }
            }
          },
          y: {
            grid: {
              color: 'rgba(255, 255, 255, 0.05)'
            },
            ticks: {
              color: '#94a3b8',
              font: {
                family: "'Plus Jakarta Sans', sans-serif",
                size: 11
              },
              callback: function(value) {
                if (value >= 1000) {
                  return '₺' + (value / 1000).toFixed(0) + 'k';
                }
                return '₺' + value;
              }
            }
          }
        }
      }
    });
  }
}

// ===================================================================
// ADMIN AYLIK GÖREV GRAFİKLERİ
// ===================================================================

let adminTopicChartInstance = null;
let adminStatusBarChartInstance = null;

export const TASK_TOPIC_COLORS = {
  'Banyo': '#06b6d4',
  'Yurt Yemeği': '#f97316',
  'Kardiyo': '#ef4444',
  'Derse Gitmek': '#8b5cf6',
  'Ödemeler': '#0ea5e9',
  'Çalışmalar': '#10b981',
  'Alışveriş': '#ec4899',
  'Özel': '#f59e0b',
  'Diğer': '#64748b'
};

/**
 * Aylık görev sekmesindeki her iki grafiği günceller
 */
export function updateAdminTaskCharts(tasks) {
  updateAdminTopicDistributionChart(tasks);
  updateAdminTaskStatusBarChart(tasks);
}

/**
 * Konulara göre görev dağılımı grafiği (Doughnut)
 */
export function updateAdminTopicDistributionChart(tasks) {
  const canvas = document.getElementById('adminTasksTopicChart');
  const emptyState = document.getElementById('adminTopicChartEmpty');
  const tag = document.getElementById('adminTopicChartTag');
  if (!canvas) return;

  if (!tasks || tasks.length === 0) {
    if (emptyState) emptyState.classList.remove('hidden');
    if (tag) tag.textContent = '0 Konu';
    if (adminTopicChartInstance) {
      adminTopicChartInstance.destroy();
      adminTopicChartInstance = null;
    }
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');

  // Konu bazlı sayıları hesapla
  const topicCounts = {};
  tasks.forEach(t => {
    const topic = t.topic || 'Diğer';
    topicCounts[topic] = (topicCounts[topic] || 0) + 1;
  });

  const labels = Object.keys(topicCounts);
  const data = Object.values(topicCounts);
  const bgColors = labels.map((l, idx) => TASK_TOPIC_COLORS[l] || DEFAULT_COLOR_PALETTE[idx % DEFAULT_COLOR_PALETTE.length]);
  const total = tasks.length;

  if (tag) {
    tag.textContent = `${labels.length} Konu • ${total} Görev`;
  }

  if (adminTopicChartInstance) {
    adminTopicChartInstance.data.labels = labels;
    adminTopicChartInstance.data.datasets[0].data = data;
    adminTopicChartInstance.data.datasets[0].backgroundColor = bgColors;
    adminTopicChartInstance.update();
  } else {
    adminTopicChartInstance = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: bgColors,
          borderWidth: 2,
          borderColor: '#0f172a',
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '66%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: '#94a3b8',
              font: {
                family: "'Plus Jakarta Sans', sans-serif",
                size: 11
              },
              boxWidth: 10,
              boxHeight: 10,
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 10
            }
          },
          tooltip: {
            backgroundColor: '#1e293b',
            titleColor: '#f8fafc',
            bodyColor: '#cbd5e1',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            padding: 10,
            callbacks: {
              label: function(context) {
                const val = context.parsed;
                const pct = total > 0 ? ((val / total) * 100).toFixed(0) : 0;
                return ` ${context.label}: ${val} Görev (%${pct})`;
              }
            }
          }
        }
      }
    });
  }
}

/**
 * Konu bazında tamamlanma durumu grafiği (Stacked Bar)
 */
export function updateAdminTaskStatusBarChart(tasks) {
  const canvas = document.getElementById('adminTasksStatusBarChart');
  const emptyState = document.getElementById('adminStatusBarChartEmpty');
  if (!canvas) return;

  if (!tasks || tasks.length === 0) {
    if (emptyState) emptyState.classList.remove('hidden');
    if (adminStatusBarChartInstance) {
      adminStatusBarChartInstance.destroy();
      adminStatusBarChartInstance = null;
    }
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');

  // Konuları belirle
  const topicsSet = new Set(tasks.map(t => t.topic || 'Diğer'));
  const labels = Array.from(topicsSet);

  const completedData = [];
  const pendingData = [];

  labels.forEach(topic => {
    const topicTasks = tasks.filter(t => (t.topic || 'Diğer') === topic);
    const completed = topicTasks.filter(t => t.status === 'completed').length;
    const pending = topicTasks.filter(t => t.status !== 'completed').length;
    completedData.push(completed);
    pendingData.push(pending);
  });

  if (adminStatusBarChartInstance) {
    adminStatusBarChartInstance.data.labels = labels;
    adminStatusBarChartInstance.data.datasets[0].data = completedData;
    adminStatusBarChartInstance.data.datasets[1].data = pendingData;
    adminStatusBarChartInstance.update();
  } else {
    adminStatusBarChartInstance = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Tamamlandı',
            data: completedData,
            backgroundColor: '#10b981',
            borderRadius: 4,
            barPercentage: 0.65
          },
          {
            label: 'Bekliyor',
            data: pendingData,
            backgroundColor: '#f59e0b',
            borderRadius: 4,
            barPercentage: 0.65
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
            ticks: {
              color: '#94a3b8',
              font: {
                family: "'Plus Jakarta Sans', sans-serif",
                size: 11
              }
            }
          },
          y: {
            stacked: true,
            beginAtZero: true,
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: {
              color: '#94a3b8',
              stepSize: 1,
              precision: 0,
              font: {
                family: "'Plus Jakarta Sans', sans-serif",
                size: 11
              }
            }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1e293b',
            titleColor: '#f8fafc',
            bodyColor: '#cbd5e1',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            padding: 10,
            callbacks: {
              label: function(context) {
                return ` ${context.dataset.label}: ${context.parsed.y} Görev`;
              },
              footer: function(items) {
                const totalTopic = items.reduce((acc, it) => acc + it.parsed.y, 0);
                return `Toplam: ${totalTopic} Görev`;
              }
            }
          }
        }
      }
    });
  }
}

