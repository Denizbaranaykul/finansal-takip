/**
 * ===================================================================
 * BÜTÇEM PRO - GRAFİK YÖNETİMİ (charts.js)
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
  'Yurt Ücreti': '#6366f1',
  'Ulaşım': '#f59e0b',
  'Fatura & Aidat': '#0ea5e9',
  'Sağlık & Bakım': '#ec4899',
  'Eğlence & Sosyal': '#8b5cf6',
  'Eğitim': '#14b8a6',
  'Giyim & Alışveriş': '#f43f5e',
  'Diğer Gider': '#64748b',

  // Geriye Dönük Uyumluluk (Eski Kayıtlar İçin)
  'Market & Gıda': '#10b981',
  'Kira & Konut': '#6366f1',
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
  '#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#0ea5e9',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#64748b'
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
