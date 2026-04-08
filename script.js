const kecamatan = {
"010":"WADASLINTANG",
"020":"KEPIL",
"030":"SAPURAN",
"031":"KALIBAWANG",
"040":"KALIWIRO",
"050":"LEKSONO",
"051":"SUKOHARJO",
"060":"SELOMERTO",
"070":"KALIKAJAR",
"080":"KERTEK",
"090":"WONOSOBO",
"100":"WATUMALANG",
"110":"MOJOTENGAH",
"120":"GARUNG",
"130":"KEJAJAR"
}

// 🔗 GANTI DENGAN LINK GOOGLE SHEETS KAMU
const DATA_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQOy5bdGMBef5FhKvs69-RqlGxuLrZ-_Zo43fMxAY89f1CgQTFDi2y1nTTMWKxHcOfMgWWOvI5XRVwF/pub?gid=569179456&single=true&output=csv";

let statusChart, kecChart;

// ================= LOADING =================
function showLoading(){
document.getElementById("table").innerHTML = `
<tr><td colspan="5" class="text-center">Loading data...</td></tr>
`;
}

// ================= LAST UPDATE =================
function updateTime(){
let now = new Date();
let formatted = now.toLocaleString("id-ID");
document.getElementById("lastUpdate").innerText = "Last Update: " + formatted;
}

// ================= LOAD DATA =================
function loadData(){

showLoading();

fetch(DATA_URL)
.then(response => response.text())
.then(data => {

let rows = data.split(/\r?\n/).slice(1);

let open=0, submit=0, reject=0;
let kecData={};

rows.forEach(row=>{

if(!row) return;

let col = row.split(",");
let kec = col[0]?.trim();
let status = col[1]?.trim();

if(!kec || !status) return;

if(!kecData[kec]){
kecData[kec] = {open:0,submit:0,reject:0}
}

if(status==="OPEN"){ open++; kecData[kec].open++ }
if(status==="SUBMITTED BY Pencacah"){ submit++; kecData[kec].submit++ }
if(status==="REJECT"){ reject++; kecData[kec].reject++ }

});

let total = open+submit+reject;

// ================= UPDATE CARD =================
document.getElementById("open").innerText=open.toLocaleString("id-ID")
document.getElementById("submit").innerText=submit.toLocaleString("id-ID")
document.getElementById("reject").innerText=reject.toLocaleString("id-ID")

let progress = total ? ((submit/total)*100).toFixed(2) : 0;
document.getElementById("progress").innerText=progress+"%"


// ================= CHART STATUS =================
if(statusChart) statusChart.destroy();

statusChart = new Chart(document.getElementById("statusChart"),{
type:"pie",
data:{
labels:["OPEN","SUBMITED","REJECT"],
datasets:[{
data:[open,submit,reject],
backgroundColor:["#ffc107","#198754","#dc3545"]
}]
}
})


// ================= TABLE =================
let tableHTML = "";

Object.keys(kecData).sort().forEach(kec=>{

let d = kecData[kec];
let totalKec = d.open + d.submit + d.reject;
let prog = totalKec ? ((d.submit/totalKec)*100).toFixed(2) : 0;

tableHTML += `
<tr>
<td>${kecamatan[kec] || kec}</td>
<td>${d.open}</td>
<td>${d.submit}</td>
<td>${d.reject}</td>
<td>${prog}%</td>
</tr>
`

});

document.getElementById("table").innerHTML = tableHTML;


// ================= CHART KEC =================
if(kecChart) kecChart.destroy();

let labels = [];
let progressData = [];

Object.keys(kecData).sort().forEach(kec=>{
let d = kecData[kec];
let totalKec = d.open + d.submit + d.reject;
let prog = totalKec ? ((d.submit/totalKec)*100).toFixed(2) : 0;

labels.push(kecamatan[kec] || kec);
progressData.push(prog);
});

kecChart = new Chart(document.getElementById("kecChart"),{
type:"bar",
data:{
labels:labels,
datasets:[{
label:"Progress (%)",
data:progressData,
backgroundColor:"#0d6efd"
}]
},
options:{
scales:{
y:{ beginAtZero:true, max:100 }
}
}
})

// update waktu
updateTime();

})
.catch(err=>{
console.error(err);
});

}

// ================= AUTO REFRESH =================
loadData();

// refresh tiap 5 menit (300000 ms)
setInterval(loadData, 300000);