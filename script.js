let expenseCategories=[], incomeCategories=[], expenseEntries=[], incomeEntries=[], currencySymbol='₹';
let expenseChart, incomeChart;

// Currency toggle
document.getElementById('currency').addEventListener('change', e=>{
  currencySymbol=e.target.value;
  updateAll();
});

// Category functions
function addCategory(type){
  let input=document.getElementById(type==='expense'?'new-expense-category':'new-income-category');
  let select=document.getElementById(type==='expense'?'expense-category':'income-category');
  let list=document.getElementById(type==='expense'?'expense-category-list':'income-category-list');
  let categories=type==='expense'?expenseCategories:incomeCategories;
  let value=input.value.trim();
  if(!value) return alert('Enter category!');
  if(categories.includes(value)) return alert('Category exists!');
  categories.push(value);

  let option=document.createElement('option'); option.value=value; option.text=value; select.add(option);
  let div=document.createElement('div'); div.className='category-item'; div.id=`${type}-cat-${value}`;
  div.innerHTML=value+` <button onclick="deleteCategory('${type}','${value}')">x</button>`;
  list.appendChild(div);
  input.value='';
}

function deleteCategory(type,category){
  let categories=type==='expense'?expenseCategories:incomeCategories;
  let select=document.getElementById(type==='expense'?'expense-category':'income-category');
  categories=categories.filter(c=>c!==category);
  if(type==='expense'){ expenseCategories=categories; expenseEntries=expenseEntries.filter(e=>e.category!==category); }
  else{ incomeCategories=categories; incomeEntries=incomeEntries.filter(e=>e.category!==category); }
  for(let i=0;i<select.options.length;i++) if(select.options[i].value===category) select.remove(i);
  document.getElementById(`${type}-cat-${category}`).remove();
  updateAll();
}

// Entry functions
function addEntry(type){
  let date=document.getElementById(type==='expense'?'expense-date':'income-date').value;
  let category=document.getElementById(type==='expense'?'expense-category':'income-category').value;
  let amount=parseFloat(document.getElementById(type==='expense'?'expense-amount':'income-amount').value);
  if(!date||!category||!amount) return alert('Fill all!');
  if(type==='expense') expenseEntries.push({date,category,amount});
  else incomeEntries.push({date,category,amount});
  document.getElementById(type==='expense'?'expense-amount':'income-amount').value='';
  updateAll();
}

// Delete entry
function deleteEntry(type,index){
  if(type==='expense') expenseEntries.splice(index,1);
  else incomeEntries.splice(index,1);
  updateAll();
}

// Filter
function getFilter(){
  let val=document.getElementById('filter-month').value;
  if(!val) return null;
  let [year,month]=val.split('-').map(Number);
  return {year,month:month-1};
}

// Update all tables & charts
function updateAll(){
  updateTable('expense'); updateTable('income');
  updateChart('expense'); updateChart('income');
}

// Update table
function updateTable(type){
  let tbody=document.getElementById(type==='expense'?'expense-table':'income-table').querySelector('tbody');
  let totalCell=document.getElementById(type==='expense'?'expense-total':'income-total');
  tbody.innerHTML='';
  let total=0;
  let filter=getFilter();
  let entries=type==='expense'?expenseEntries:incomeEntries;
  entries.forEach((e,i)=>{
    let d=new Date(e.date);
    if(filter&&(d.getFullYear()!=filter.year||d.getMonth()!=filter.month)) return;
    total+=e.amount;
    let tr=document.createElement('tr');
    tr.innerHTML=`<td>${e.date}</td><td>${e.category}</td><td>${currencySymbol}${e.amount}</td>
                  <td><button onclick="deleteEntry('${type}',${i})">Delete</button></td>`;
    tbody.appendChild(tr);
  });
  totalCell.innerText=currencySymbol+total;
}

// Update chart
function updateChart(type){
  let filter=getFilter();
  let entries=type==='expense'?expenseEntries:incomeEntries;
  let data={};
  entries.forEach(e=>{
    let d=new Date(e.date);
    if(filter&&(d.getFullYear()!=filter.year||d.getMonth()!=filter.month)) return;
    if(!data[e.category]) data[e.category]=0;
    data[e.category]+=e.amount;
  });
  if(type==='expense'&&expenseChart) expenseChart.destroy();
  if(type==='income'&&incomeChart) incomeChart.destroy();
  let ctx=document.getElementById(type==='expense'?'expense-chart':'income-chart').getContext('2d');
  let chart=new Chart(ctx,{type:'pie',data:{labels:Object.keys(data),datasets:[{data:Object.values(data),backgroundColor:generateColors(Object.keys(data).length)}]}});
  if(type==='expense') expenseChart=chart; else incomeChart=chart;
}

// Random colors
function generateColors(n){ let colors=[]; for(let i=0;i<n;i++) colors.push(`hsl(${Math.floor(Math.random()*360)},70%,60%)`); return colors; }

// Export PDF
document.getElementById('export-btn').addEventListener('click', async ()=>{
  const { jsPDF }=window.jspdf;
  let pdf=new jsPDF('p','pt','a4');
  let y=20;
  pdf.setFontSize(18); pdf.text("Expense & Income Report",150,y); y+=30;
  let filter=getFilter();

  // Helper to add table & chart
  async function addSection(type){
    pdf.setFontSize(14); pdf.text(type==='expense'?'Expenses':'Income',20,y); y+=20;
    let entries=type==='expense'?expenseEntries:incomeEntries;
    let tableData=[];
    entries.forEach(e=>{
      let d=new Date(e.date);
      if(filter&&(d.getFullYear()!=filter.year||d.getMonth()!=filter.month)) return;
      tableData.push([e.date,e.category,currencySymbol+e.amount]);
    });
    tableData.forEach((row,i)=>{ pdf.text(row.join(' | '),20,y+i*20); });
    y+=tableData.length*20+10;
    // Add chart
    let chart=type==='expense'?expenseChart:incomeChart;
    if(chart){ let img=chart.toBase64Image(); pdf.addImage(img,'PNG',150,y,300,200); y+=220; }
  }

  await addSection('expense');
  await addSection('income');

  pdf.save('Expense_Income_Report.pdf');
});
