let gerandoPDF = false; // trava anti múltiplos downloads

function calcularEstatisticas(dados){
    const soma = dados.reduce((a,b)=>a+b,0);
    const media = soma / dados.length;
    const max = Math.max(...dados);
    const min = Math.min(...dados);

    return {
        media: media.toFixed(1),
        max,
        min
    }
}

async function gerarRelatorioPDF(){

    if(gerandoPDF) return; // impede vários downloads
    gerandoPDF = true;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // ===== COLETA DADOS =====
    const temperaturas = historicoTemp;
    const umidades = historicoUmidade;
    const luminosidade = historicoLuz;

    const estatTemp = calcularEstatisticas(temperaturas);
    const estatUmi = calcularEstatisticas(umidades);
    const estatLuz = calcularEstatisticas(luminosidade);

    // ===== CAPTURA GRÁFICOS COMO IMAGEM =====
    const imgTemp = obterImagemGrafico("graficoTemp");
    const imgUmi = obterImagemGrafico("graficoUmidade");
    const imgLuz = obterImagemGrafico("graficoLuz");

    // ===== CAPA =====
    doc.setFontSize(22);
    doc.text("RELATÓRIO CLIMÁTICO INTELIGENTE", 20, 20);

    doc.setFontSize(12);
    doc.text("Sistema de Monitoramento Ambiental", 20, 30);
    doc.text("Data: " + new Date().toLocaleString(), 20, 38);

    // ===== RESUMO EXECUTIVO =====
    doc.setFontSize(16);
    doc.text("Resumo Geral", 20, 55);

    doc.setFontSize(12);
    doc.text(`Temperatura Média: ${estatTemp.media} °C`, 20, 65);
    doc.text(`Umidade Média: ${estatUmi.media} %`, 20, 72);
    doc.text(`Luminosidade Média: ${estatLuz.media} lx`, 20, 79);

    doc.text(`Temperatura Máx: ${estatTemp.max} °C`, 110, 65);
    doc.text(`Umidade Máx: ${estatUmi.max} %`, 110, 72);
    doc.text(`Luminosidade Máx: ${estatLuz.max} lx`, 110, 79);

    doc.text(`Temperatura Min: ${estatTemp.min} °C`, 20, 90);
    doc.text(`Umidade Min: ${estatUmi.min} %`, 20, 97);
    doc.text(`Luminosidade Min: ${estatLuz.min} lx`, 20, 104);

    // ===== PÁGINA GRÁFICO TEMPERATURA =====
    doc.addPage();
    doc.setFontSize(18);
    doc.text("Gráfico de Temperatura", 20, 20);
    doc.addImage(imgTemp, "PNG", 15, 30, 180, 100);

    // ===== PÁGINA GRÁFICO UMIDADE =====
    doc.addPage();
    doc.setFontSize(18);
    doc.text("Gráfico de Umidade", 20, 20);
    doc.addImage(imgUmi, "PNG", 15, 30, 180, 100);

    // ===== PÁGINA GRÁFICO LUZ =====
    doc.addPage();
    doc.setFontSize(18);
    doc.text("Gráfico de Luminosidade", 20, 20);
    doc.addImage(imgLuz, "PNG", 15, 30, 180, 100);

    // ===== ANÁLISE AUTOMÁTICA =====
    doc.addPage();
    doc.setFontSize(18);
    doc.text("Análise Inteligente", 20, 20);

    doc.setFontSize(12);

    let analise = [];

    if(estatTemp.media > 30)
        analise.push("Temperatura elevada detectada.");
    else
        analise.push("Temperatura dentro da faixa ideal.");

    if(estatUmi.media < 40)
        analise.push("Ambiente seco.");
    else
        analise.push("Umidade adequada.");

    if(estatLuz.media < 300)
        analise.push("Baixa luminosidade.");
    else
        analise.push("Boa iluminação.");

    let y = 40;
    analise.forEach(txt=>{
        doc.text("- " + txt, 20, y);
        y += 10;
    });

    // ===== SALVAR PDF =====
    doc.save("Relatorio_Completo.pdf");

    gerandoPDF = false;
}