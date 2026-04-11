const kecamatan = {
"010":"WADASLINTANG","020":"KEPIL","030":"SAPURAN","031":"KALIBAWANG",
"040":"KALIWIRO","050":"LEKSONO","051":"SUKOHARJO","060":"SELOMERTO",
"070":"KALIKAJAR","080":"KERTEK","090":"WONOSOBO","100":"WATUMALANG",
"110":"MOJOTENGAH","120":"GARUNG","130":"KEJAJAR"
}

const DATA_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQOy5bdGMBef5FhKvs69-RqlGxuLrZ-_Zo43fMxAY89f1CgQTFDi2y1nTTMWKxHcOfMgWWOvI5XRVwF/pub?gid=569179456&single=true&output=csv";

let statusChart, kecChart, keberadaanChart;
let selectedKec = "ALL";


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

// FILTER
if(selectedKec !== "ALL" && kec !== selectedKec) return;


// ================= LAST UPDATE =================
let t = parseTanggal(waktu);
if(t && (!lastTime || t > lastTime)){
lastTime = t;
}


// ================= INIT KEC =================
if(!kecData[kec]){
kecData[kec]={
open:0,submit:0,reject:0,
tidak:0,ditemukan:0,meninggal:0,
tidakEligible:0,tidakDitemui:0
}
}


// ================= INIT PETUGAS =================
if(nama){
let key = kec + "_" + nama; // 🔥 biar tidak ketimpa

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


// ================= STATUS =================
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


// ================= KEBERADAAN =================
if(keberadaan?.includes("0. Tidak Ditemukan")){ tidak++; kecData[kec].tidak++ }
if(keberadaan?.includes("1. Ditemukan")){ ditemukan++; kecData[kec].ditemukan++ }
if(keberadaan?.includes("3. Meninggal")){ meninggal++; kecData[kec].meninggal++ }
if(keberadaan?.includes("4. Tidak Eligible")){ tidakEligible++; kecData[kec].tidakEligible++ }
if(keberadaan?.includes("Tidak dapat ditemui")){ tidakDitemui++; kecData[kec].tidakDitemui++ }

});


// ================= DROPDOWN =================
let dropdown = document.getElementById("filterKec");
if(dropdown && dropdown.options.length === 1){
Object.keys(kecamatan).forEach(k=>{
let opt = document.createElement("option");
opt.value = k;
opt.text = kecamatan[k];
dropdown.appendChild(opt);
});
}


// ================= CARD =================
let total = open+submit+reject;

document.getElementById("open").innerText=open.toLocaleString("id-ID");
document.getElementById("submit").innerText=submit.toLocaleString("id-ID");
document.getElementById("reject").innerText=reject.toLocaleString("id-ID");

let progress = total ? ((submit/total)*100).toFixed(2) : 0;
document.getElementById("progress").innerText=progress+"%";


// ================= LAST UPDATE =================
if(lastTime){
document.getElementById("lastUpdate").innerText =
"Last Update: " + formatWaktu(lastTime);
}


// ================= CHART STATUS =================
if(statusChart) statusChart.destroy();

statusChart = new Chart(document.getElementById("statusChart"),{
type:"pie",
data:{
labels:["OPEN","SUBMIT","REJECT"],
datasets:[{
data:[open,submit,reject],
backgroundColor:["#ffc107","#198754","#dc3545"]
}]
}
});


// ================= CHART KEBERADAAN =================
if(keberadaanChart) keberadaanChart.destroy();

keberadaanChart = new Chart(document.getElementById("keberadaanChart"),{
type:"pie",
data:{
labels:[
"Tidak Ditemukan",
"Ditemukan",
"Meninggal",
"Tidak Eligible",
"Tidak Ditemui"
],
datasets:[{
data:[tidak,ditemukan,meninggal,tidakEligible,tidakDitemui],
backgroundColor:["#6c757d","#198754","#dc3545","#0dcaf0","#fd7e14"]
}]
}
});


// ================= TABLE KEC =================
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
<td>${d.open}</td>
<td>${d.submit}</td>
<td>${d.reject}</td>
<td>${prog}%</td>
<td>${d.tidak}</td>
<td>${d.ditemukan}</td>
<td>${d.meninggal}</td>
<td>${d.tidakEligible}</td>
<td>${d.tidakDitemui}</td>
</tr>
`;
});

document.getElementById("table").innerHTML=html;


// ================= TABLE PETUGAS (URUT KEC → NAMA) =================
let petugasHTML="";

let sortedPetugas = Object.values(petugasData).sort((a,b)=>{
if(a.kec === b.kec){
return a.nama.localeCompare(b.nama);
}
return a.kec.localeCompare(b.kec);
});

sortedPetugas.forEach(d=>{

let total = d.open + d.submit + d.reject;
let prog = total ? ((d.submit/total)*100).toFixed(2) : 0;

petugasHTML += `
<tr>
<td>${kecamatan[d.kec] || d.kec}</td>
<td>${d.nama}</td>
<td>${d.open}</td>
<td>${d.submit}</td>
<td>${d.reject}</td>
<td>${prog}%</td>
</tr>
`;

});

let petugasTable = document.getElementById("tablePetugas");
if(petugasTable){
petugasTable.innerHTML = petugasHTML;
}


// ================= CHART KEC =================
if(kecChart) kecChart.destroy();

let labels=[], dataProg=[];

Object.keys(kecData).sort().forEach(kec=>{
let d=kecData[kec];
let totalKec=d.open+d.submit+d.reject;
let prog=totalKec?((d.submit/totalKec)*100).toFixed(2):0;

labels.push(kecamatan[kec]||kec);
dataProg.push(prog);
});

kecChart = new Chart(document.getElementById("kecChart"),{
type:"bar",
data:{
labels:labels,
datasets:[{
label:"Progress (%)",
data:dataProg,
backgroundColor:"#0d6efd"
}]
},
options:{
scales:{
y:{beginAtZero:true,max:100}
}
}
});

});
}


// ================= EVENT FILTER =================
document.getElementById("filterKec").addEventListener("change", function(){
selectedKec = this.value;
loadData();
});


// ================= INIT =================
loadData();
setInterval(loadData,300000);