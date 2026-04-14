const kecamatan = {
"010":"WADASLINTANG","020":"KEPIL","030":"SAPURAN","031":"KALIBAWANG",
"040":"KALIWIRO","050":"LEKSONO","051":"SUKOHARJO","060":"SELOMERTO",
"070":"KALIKAJAR","080":"KERTEK","090":"WONOSOBO","100":"WATUMALANG",
"110":"MOJOTENGAH","120":"GARUNG","130":"KEJAJAR"
}

const DATA_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQOy5bdGMBef5FhKvs69-RqlGxuLrZ-_Zo43fMxAY89f1CgQTFDi2y1nTTMWKxHcOfMgWWOvI5XRVwF/pub?gid=569179456&single=true&output=csv";

let statusChart, kecChart, keberadaanChart;
let selectedKec = "ALL";

// ================= WARNA PASTEL =================
const COLORS = {
open: "#FFD6A5",
submit: "#8FD6B5",
reject: "#FF9AA2",

tidak: "#C7CED6",
ditemukan: "#8FD6B5",
meninggal: "#FF9AA2",
tidakEligible: "#AFCBFF",
tidakDitemui: "#FFD6A5",

bar: "#7DA8F0"
};

// ================= PARSE TANGGAL =================
function parseTanggal(waktu){
if(!waktu) return null;

try{
let [tanggal, jam] = waktu.split(" ");
let [d, m, y] = tanggal.split("/");
let [h, min, s] = jam.split(":");

return new Date(y, m-1, d, h, min, s);
}catch{
return null;
}
}


// ================= FORMAT WAKTU =================
function formatWaktu(date){
let d = String(date.getDate()).padStart(2,'0');
let m = String(date.getMonth()+1).padStart(2,'0');
let y = date.getFullYear();

let h = String(date.getHours()).padStart(2,'0');
let min = String(date.getMinutes()).padStart(2,'0');
let s = String(date.getSeconds()).padStart(2,'0');

return `${d}/${m}/${y} ${h}:${min}:${s}`;
}


// ================= LABEL DI ATAS BAR =================
const labelBarPlugin = {
id: 'labelBarPlugin',
afterDatasetsDraw(chart) {
const {ctx} = chart;

chart.data.datasets.forEach((dataset, i) => {
const meta = chart.getDatasetMeta(i);

meta.data.forEach((bar, index) => {
let value = dataset.data[index];

ctx.fillStyle = "#000";
ctx.font = "bold 10px Arial";
ctx.textAlign = "center";

ctx.fillText(value + "%", bar.x, bar.y - 5);
});
});
}
};

// ================= LABEL DONUT (%) =================
const doughnutLabel = {
id: 'doughnutLabel',
afterDraw(chart) {
const {ctx} = chart;
const dataset = chart.data.datasets[0].data;
const total = dataset.reduce((a,b)=>a+b,0) || 1;

chart.getDatasetMeta(0).data.forEach((arc, i) => {
let value = dataset[i];
if(value === 0) return;

let percent = ((value/total)*100).toFixed(1)+"%";

let x = arc.tooltipPosition().x;
let y = arc.tooltipPosition().y;

ctx.fillStyle = "#000";
ctx.font = "11px Arial";
ctx.textAlign = "center";
ctx.fillText(percent, x, y);
});
}
};


// ================= EXPORT FUNCTION =================
function downloadExcel(filename, rows){

let csvContent = "data:text/csv;charset=utf-8,sep=;\n"; // ✅ tambahan sep

rows.forEach(row=>{
csvContent += row.join(";") + "\n";
});

let encodedUri = encodeURI(csvContent);
let link = document.createElement("a");

link.setAttribute("href", encodedUri);
link.setAttribute("download", filename);

document.body.appendChild(link);
link.click();
document.body.removeChild(link);
}


// ================= EXPORT KECAMATAN =================
function exportKecamatan(){

let rows = [];

rows.push([
"Kecamatan","OPEN","SUBMITTED","REJECTED","Progress (%)",
"Tidak Ditemukan","Ditemukan","Meninggal",
"Tidak Eligible","Tidak Ditemui"
]);

Object.keys(window.kecDataExport || {}).sort().forEach(kec=>{

let d = window.kecDataExport[kec];
let total = d.open + d.submit + d.reject;
let prog = total ? ((d.submit/total)*100).toFixed(2) : 0;

rows.push([
kecamatan[kec]||kec,
d.open,
d.submit,
d.reject,
prog,
d.tidak,
d.ditemukan,
d.meninggal,
d.tidakEligible,
d.tidakDitemui
]);

});

downloadExcel("kecamatan.csv", rows);
}


// ================= EXPORT PETUGAS =================
function exportPetugas(){

let rows = [];

rows.push([
"Kecamatan","Nama Petugas","OPEN","SUBMITTED","REJECTED","Progress (%)"
]);

(window.petugasDataExport || []).forEach(p=>{

rows.push([
kecamatan[p.kec] || p.kec,
p.nama,
p.open,
p.submit,
p.reject,
p.progress
]);

});

downloadExcel("petugas.csv", rows);
}


// ================= LOAD DATA =================
function loadData(){

fetch(DATA_URL)
.then(res => res.text())
.then(data => {

let rows = data.split(/\r?\n/).slice(1);

let open=0, submit=0, reject=0;
let tidak=0, ditemukan=0, meninggal=0, tidakEligible=0, tidakDitemui=0;

let kecData={};
let petugasData={};

let lastTime = null;


// ================= LOOP DATA =================
rows.forEach(row=>{
if(!row) return;

let col = row.split(",").map(x=>x.trim());

let kec = col[0]?.padStart(3,"0");
let status = col[1];
let keberadaan = col[2];
let nama = col[4];
let waktu = col[5];

if(!kec || !status) return;

if(selectedKec !== "ALL" && kec !== selectedKec) return;


// LAST UPDATE
let t = parseTanggal(waktu);
if(t && (!lastTime || t > lastTime)){
lastTime = t;
}


// INIT KEC
if(!kecData[kec]){
kecData[kec]={
open:0,submit:0,reject:0,
tidak:0,ditemukan:0,meninggal:0,
tidakEligible:0,tidakDitemui:0
}
}


// INIT PETUGAS
if(nama){
let key = kec + "_" + nama;

if(!petugasData[key]){
petugasData[key]={
kec:kec,
nama:nama,
open:0,
submit:0,
reject:0
}
}
}


// STATUS
if(status==="OPEN"){
open++;
kecData[kec].open++;
if(nama) petugasData[kec+"_"+nama].open++;
}

if(status?.includes("SUBMITTED BY Pencacah")){
submit++;
kecData[kec].submit++;
if(nama) petugasData[kec+"_"+nama].submit++;
}

if(status?.includes("REJECTED BY Admin Kabupaten")){
reject++;
kecData[kec].reject++;
if(nama) petugasData[kec+"_"+nama].reject++;
}


// KEBERADAAN
if(keberadaan?.includes("0. Tidak Ditemukan")){ tidak++; kecData[kec].tidak++ }
if(keberadaan?.includes("1. Ditemukan")){ ditemukan++; kecData[kec].ditemukan++ }
if(keberadaan?.includes("3. Meninggal")){ meninggal++; kecData[kec].meninggal++ }
if(keberadaan?.includes("4. Tidak Eligible")){ tidakEligible++; kecData[kec].tidakEligible++ }
if(keberadaan?.includes("Tidak dapat ditemui")){ tidakDitemui++; kecData[kec].tidakDitemui++ }

});


// SIMPAN UNTUK EXPORT
window.kecDataExport = kecData;


// DROPDOWN
let dropdown = document.getElementById("filterKec");
if(dropdown && dropdown.options.length === 1){
Object.keys(kecamatan).forEach(k=>{
let opt = document.createElement("option");
opt.value = k;
opt.text = kecamatan[k];
dropdown.appendChild(opt);
});
}


// CARD
let total = open+submit+reject;

document.getElementById("open").innerText=open.toLocaleString("id-ID");
document.getElementById("submit").innerText=submit.toLocaleString("id-ID");
document.getElementById("reject").innerText=reject.toLocaleString("id-ID");

let progress = total ? ((submit/total)*100).toFixed(2) : 0;
document.getElementById("progress").innerText=progress+"%";


// LAST UPDATE
if(lastTime){
document.getElementById("lastUpdate").innerText =
"Last Update: " + formatWaktu(lastTime);
}


// ================= CHART STATUS =================
if(statusChart) statusChart.destroy();
statusChart = new Chart(document.getElementById("statusChart"),{
type:"doughnut",
data:{
labels:["OPEN","SUBMIT","REJECT"],
datasets:[{
data:[open,submit,reject],
backgroundColor:[COLORS.open,COLORS.submit,COLORS.reject]
}]
},
options:{
responsive:true,
maintainAspectRatio:false,
cutout:"65%",
plugins:{legend:{position:"bottom"}}
},
plugins:[doughnutLabel]
});


// ================= CHART KEBERADAAN =================
if(keberadaanChart) keberadaanChart.destroy();
keberadaanChart = new Chart(document.getElementById("keberadaanChart"),{
type:"doughnut",
data:{
labels:["Tidak Ditemukan","Ditemukan","Meninggal","Tidak Eligible","Tidak Ditemui"],
datasets:[{
data:[tidak,ditemukan,meninggal,tidakEligible,tidakDitemui],
backgroundColor:[
COLORS.tidak,COLORS.ditemukan,COLORS.meninggal,
COLORS.tidakEligible,COLORS.tidakDitemui]
}]
},
options:{
responsive:true,
maintainAspectRatio:false,
cutout:"65%",
plugins:{legend:{position:"bottom"}}
},
plugins:[doughnutLabel]
});


// TABLE KEC
let html="";
Object.keys(kecData).sort().forEach(kec=>{
let d=kecData[kec];
let totalKec=d.open+d.submit+d.reject;
let prog=totalKec?((d.submit/totalKec)*100).toFixed(2):0;

let warna = prog >= 80 ? "#d1e7dd" :
             prog >= 50 ? "#fff3cd" : "#f8d7da";

html+=`
<tr style="background:${warna}">
<td>${kecamatan[kec]||kec}</td>
<td class="text-end">${d.open}</td>
<td class="text-end">${d.submit}</td>
<td class="text-end">${d.reject}</td>
<td class="text-end">${prog}%</td>
<td class="text-end">${d.tidak}</td>
<td class="text-end">${d.ditemukan}</td>
<td class="text-end">${d.meninggal}</td>
<td class="text-end">${d.tidakEligible}</td>
<td class="text-end">${d.tidakDitemui}</td>
</tr>
`;
});
document.getElementById("table").innerHTML=html;


// TABLE PETUGAS
let petugasArr=[];
Object.values(petugasData).forEach(d=>{
let total=d.open+d.submit+d.reject;
let prog=total?((d.submit/total)*100).toFixed(2):0;

petugasArr.push({...d,progress:prog});
});

// simpan untuk export
window.petugasDataExport = petugasArr;

let petugasHTML="";
petugasArr.sort((a,b)=>{
if(a.kec===b.kec) return a.nama.localeCompare(b.nama);
return a.kec.localeCompare(b.kec);
}).forEach(d=>{
petugasHTML+=`
<tr>
<td>${kecamatan[d.kec]}</td>
<td>${d.nama}</td>
<td class="text-end">${d.open}</td>
<td class="text-end">${d.submit}</td>
<td class="text-end">${d.reject}</td>
<td class="text-end">${d.progress}%</td>
</tr>
`;
});

let petugasTable=document.getElementById("tablePetugas");
if(petugasTable) petugasTable.innerHTML=petugasHTML;


// CHART KEC
if(kecChart) kecChart.destroy();

let labels=[], dataProg=[];
Object.keys(kecData).sort().forEach(kec=>{
let d=kecData[kec];
let totalKec=d.open+d.submit+d.reject;
let prog=totalKec?((d.submit/totalKec)*100).toFixed(2):0;

labels.push(kecamatan[kec]);
dataProg.push(prog);
});

kecChart=new Chart(document.getElementById("kecChart"),{
type:"bar",
data:{
labels:labels,
datasets:[{
label:"Progress (%)",
data:dataProg,
backgroundColor:"rgb(80, 141, 233)"
}]
},
options:{scales:{y:{beginAtZero:true,max:100}}},
plugins:[labelBarPlugin]
});

});
}


// EVENT FILTER
document.getElementById("filterKec").addEventListener("change", function(){
selectedKec = this.value;
loadData();
});


// INIT
loadData();
setInterval(loadData,300000);