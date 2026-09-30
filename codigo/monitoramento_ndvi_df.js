// SÉRIE TEMPORAL MENSAL DO NDVI 
// DISTRITO FEDERAL - 2018 A 2025 

 
// ÁREA DE ESTUDO - DISTRITO FEDERAL 
 
var estados = ee.FeatureCollection('FAO/GAUL/2015/level1'); 
 
var df = estados 
  .filter(ee.Filter.eq('ADM0_NAME', 'Brazil')) 
  .filter(ee.Filter.eq('ADM1_NAME', 'Distrito Federal')); 
 
Map.centerObject(df, 9); 
 
Map.addLayer( 
  df, 
  {color: 'red'}, 
  'Distrito Federal' 
); 
 
print( 
  'Área de estudo:', 
  df 
); 
 
 
// FUNÇÃO DE MÁSCARA DE NUVENS - SCL 
 
function mascaraNuvensS2(image) { 
 
  var scl = image.select('SCL'); 
 
  var mascara = scl.neq(0)     // No Data 
    .and(scl.neq(1))           // Saturado/defeituoso 
    .and(scl.neq(3))           // Sombra de nuvem 
    .and(scl.neq(8))           // Nuvem - probabilidade média 
    .and(scl.neq(9))           // Nuvem - probabilidade alta 
    .and(scl.neq(10))          // Cirrus 
    .and(scl.neq(11));         // Neve/gelo 
 
  return image.updateMask(mascara); 
} 
 
 
// PERÍODO DA SÉRIE 
 
var inicioSerie = ee.Date('2018-01-01'); 
var fimSerie = ee.Date('2026-01-01'); 
 
 
// Número total de meses 
var numeroMeses = fimSerie.difference( 
  inicioSerie, 
  'month' 
); 
 

var listaMeses = ee.List.sequence( 
  0, 
  numeroMeses.subtract(1) 
); 
 
 
print( 
  'Número total esperado de meses:', 
  numeroMeses 
); 
 
 
// CRIA UMA IMAGEM NDVI PARA CADA MÊS 

var listaImagensMensais = listaMeses.map(function(i) { 
 
  i = ee.Number(i); 
 
  var inicioMes = inicioSerie.advance( 
    i, 
    'month' 
  ); 
 
  var fimMes = inicioMes.advance( 
    1, 
    'month' 
  ); 
 
 
  // Sentinel-2 daquele mês 
 
  var colecaoMes = ee.ImageCollection( 
    'COPERNICUS/S2_SR_HARMONIZED' 
  ) 
  .filterBounds(df) 
  .filterDate( 
    inicioMes, 
    fimMes 
  ) 
 
  // Filtro inicial 
  .filter( 
    ee.Filter.lt( 
      'CLOUDY_PIXEL_PERCENTAGE', 
      90 
    ) 
  ) 
 
  .map(mascaraNuvensS2); 
 
 
  // Número de imagens disponíveis naquele mês 
  var quantidade = colecaoMes.size(); 
 
 
  // ---------------------------------------------- 
  // SE EXISTIREM IMAGENS 
  // ---------------------------------------------- 
 
  var imagemNDVI = ee.Image( 
 
    ee.Algorithms.If( 
 
      quantidade.gt(0), 
 
      // CASO TRUE: 
      // cria a composição e calcula NDVI 
 
      colecaoMes 
        .median() 
        .normalizedDifference( 
          ['B8', 'B4'] 
        ) 
        .rename('NDVI'), 
 
 
      // CASO FALSE: 
      // cria uma imagem NDVI vazia 
 
      ee.Image.constant(0) 
        .rename('NDVI') 
        .updateMask( 
          ee.Image.constant(0) 
        ) 
 
    ) 
 
  ); 
 
 
  // Guarda informações importantes como propriedades 

  return imagemNDVI.set({ 
 
    'system:time_start': 
      inicioMes.millis(), 
 
    'data': 
      inicioMes.format('YYYY-MM'), 
 
    'ano': 
      inicioMes.get('year'), 
 
    'mes': 
      inicioMes.get('month'), 
 
    'numero_imagens': 
      quantidade 
 
  }); 
 
}); 
 
 
// CONVERTE PARA IMAGECOLLECTION 
 
var ndviMensal2018_2025 = 
  ee.ImageCollection.fromImages( 
    listaImagensMensais 
  ); 
 
 
print( 
  'Coleção mensal NDVI - 2018 a 2025:', 
  ndviMensal2018_2025 
); 
 
 
print( 
  'Número de meses processados:', 
  ndviMensal2018_2025.size() 
); 
 
 
// VERIFICA QUANTAS IMAGENS EXISTEM EM CADA MÊS 
 
var tabelaQuantidade = 
  ndviMensal2018_2025.aggregate_array( 
    'numero_imagens' 
  ); 
 
print( 
  'Quantidade de cenas Sentinel-2 por mês:', 
  tabelaQuantidade 
); 
 
 
// GRÁFICO DA SÉRIE TEMPORAL 
 
var graficoNDVI = ui.Chart.image.series({ 
 
  imageCollection: 
    ndviMensal2018_2025, 
 
  region: 
    df.geometry(), 
 
  reducer: 
    ee.Reducer.mean(), 
 
  // 30m para reduzir o processamento
  scale: 
    30, 
 
  xProperty: 
    'system:time_start' 
 
}) 
 
 
.setChartType( 
  'LineChart' 
) 
 
 
.setOptions({ 
 
  title: 
    'Série Temporal Mensal do NDVI - Distrito Federal - 2018 a 2025', 
 
  hAxis: { 
 
    title: 
      'Ano', 
 
    format: 
      'yyyy', 
 
    gridlines: { 
      count: 8 
    } 
 
  }, 
 
  vAxis: { 
 
    title: 
      'NDVI médio', 
 
    viewWindow: { 
      min: 0, 
      max: 0.8 
    } 
 
  }, 
 
  lineWidth: 
    1, 
 
  pointSize: 
    2, 
 
  legend: { 
    position: 'none' 
  } 
 
}); 
 
 
print( 
  graficoNDVI 
);


// 8. ETAPA 23 — NDVI MÉDIO DA ESTAÇÃO SECA POR ANO (JULHO, AGOSTO E SETEMBRO)

// Lista dos anos analisados
var listaAnos = ee.List.sequence(2018, 2025);


// Para cada ano, seleciona julho, agosto e setembro
var listaNDVISecoAnual = listaAnos.map(function(ano) {

  ano = ee.Number(ano);

  // Início da estação seca analisada
  var inicioSeca = ee.Date.fromYMD(
    ano,
    7,
    1
  );

  // Data final exclusiva:
  // inclui julho, agosto e setembro
  var fimSeca = ee.Date.fromYMD(
    ano,
    10,
    1
  );


  // Seleciona os três meses daquele ano
  var mesesSecos = ndviMensal2018_2025
    .filterDate(
      inicioSeca,
      fimSeca
    );


  // Calcula a média dos três meses
  var ndviSecoMedio = mesesSecos
    .mean()
    .rename('NDVI');


  // Guarda as informações do ano
  return ndviSecoMedio.set({

    'system:time_start':
      inicioSeca.millis(),

    'ano':
      ano,

    'periodo':
      'julho-setembro',

    'numero_meses':
      mesesSecos.size()

  });

});


// Converte a lista em coleção de imagens
var ndviSecoAnual = ee.ImageCollection.fromImages(
  listaNDVISecoAnual
);


print(
  'NDVI médio da estação seca por ano:',
  ndviSecoAnual
);


// Verifica se cada ano possui os três meses esperados
print(
  'Quantidade de meses utilizados em cada ano:',
  ndviSecoAnual.aggregate_array('numero_meses')
);


// TABELA COM O NDVI SECO MÉDIO DE CADA ANO

var tabelaNDVISeco = ee.FeatureCollection(

  listaAnos.map(function(ano) {

    ano = ee.Number(ano);

    var imagemAno = ndviSecoAnual
      .filter(
        ee.Filter.eq('ano', ano)
      )
      .first();


    var ndviMedioDF = ee.Image(imagemAno)
      .reduceRegion({

        reducer:
          ee.Reducer.mean(),

        geometry:
          df.geometry(),

        scale:
          30,

        maxPixels:
          1e13,

        bestEffort:
          true

      })
      .get('NDVI');


    return ee.Feature(null, {

      'ano':
        ano,

      'NDVI_seco_medio':
        ndviMedioDF

    });

  })

);


print(
  'Tabela — NDVI seco médio por ano:',
  tabelaNDVISeco
);


// GRÁFICO COMPARATIVO ANUAL

var graficoNDVISeco = ui.Chart.feature.byFeature({

  features:
    tabelaNDVISeco,

  xProperty:
    'ano',

  yProperties:
    ['NDVI_seco_medio']

})

.setChartType(
  'ColumnChart'
)

.setOptions({

  title:
    'NDVI médio da estação seca no Distrito Federal — 2018 a 2025',

  hAxis: {

    title:
      'Ano',

    format:
      '####',

    gridlines: {
      count: 8
    }

  },

  vAxis: {

    title:
      'NDVI médio — julho a setembro',

    viewWindow: {
      min: 0,
      max: 0.8
    }

  },

  colors:
    ['#D98E04'],

  legend: {
    position: 'none'
  }

});


print(
  graficoNDVISeco
);


// TENDÊNCIA TEMPORAL DO NDVI SECO

// Adiciona uma variável de tempo:
// 2018 = 0, 2019 = 1, ..., 2025 = 7
var tabelaNDVISecoComTempo = tabelaNDVISeco.map(
  function(feature) {

    var ano = ee.Number(
      feature.get('ano')
    );

    var tempo = ano.subtract(2018);

    return feature.set(
      'tempo',
      tempo
    );

  }
);


print(
  'Tabela com variável de tempo:',
  tabelaNDVISecoComTempo
);


// AJUSTE DA REGRESSÃO LINEAR

// O linearFit utiliza:
// X = tempo
// Y = NDVI seco médio
// scale  = inclinação da reta
// offset = valor inicial estimado

var regressaoNDVI = tabelaNDVISecoComTempo
  .reduceColumns({

    reducer:
      ee.Reducer.linearFit(),

    selectors:
      [
        'tempo',
        'NDVI_seco_medio'
      ]

  });


print(
  'Resultado da regressão linear:',
  regressaoNDVI
);


// Recupera os coeficientes
var inclinacao = ee.Number(
  regressaoNDVI.get('scale')
);

var intercepto = ee.Number(
  regressaoNDVI.get('offset')
);


// Mudança estimada durante os sete intervalos: 2018 → 2025
var variacaoEstimada = inclinacao.multiply(7);


print(
  'Inclinação — mudança média do NDVI por ano:',
  inclinacao
);

print(
  'Intercepto da regressão:',
  intercepto
);

print(
  'Variação estimada do NDVI entre 2018 e 2025:',
  variacaoEstimada
);


// CALCULA O COEFICIENTE DE DETERMINAÇÃO — R²

var correlacao = tabelaNDVISecoComTempo
  .reduceColumns({

    reducer:
      ee.Reducer.pearsonsCorrelation(),

    selectors:
      [
        'tempo',
        'NDVI_seco_medio'
      ]

  });


var coeficienteCorrelacao = ee.Number(
  correlacao.get('correlation')
);


// R² é o quadrado da correlação
var rQuadrado = coeficienteCorrelacao.pow(2);


print(
  'Coeficiente de correlação:',
  coeficienteCorrelacao
);

print(
  'Coeficiente de determinação — R²:',
  rQuadrado
);


// GRÁFICO COM LINHA DE TENDÊNCIA

var graficoTendencia = ui.Chart.feature.byFeature({

  features:
    tabelaNDVISecoComTempo,

  xProperty:
    'ano',

  yProperties:
    ['NDVI_seco_medio']

})

.setChartType(
  'ScatterChart'
)

.setOptions({

  title:
    'Tendência do NDVI na estação seca — DF — 2018 a 2025',

  hAxis: {

    title:
      'Ano',

    format:
      '####',

    gridlines: {
      count: 8
    }

  },

  vAxis: {

    title:
      'NDVI médio — julho a setembro',

    viewWindow: {
      min: 0,
      max: 0.8
    }

  },

  pointSize:
    7,

  colors:
    ['#D98E04'],

  legend: {
    position: 'bottom'
  },

  trendlines: {

    0: {

      type:
        'linear',

      color:
        '#C62828',

      lineWidth:
        3,

      opacity:
        0.8,

      showR2:
        true,

      visibleInLegend:
        true,

      labelInLegend:
        'Tendência linear'

    }

  }

});


print(
  graficoTendencia
);


// TENDÊNCIA ESPACIAL DO NDVI

var ndviSecoParaTendencia = ndviSecoAnual.map(
  function(imagem) {

    var ano = ee.Number(
      imagem.get('ano')
    );

    // 2018 = 0, 2019 = 1, ..., 2025 = 7
    var tempo = ee.Image.constant(
      ano.subtract(2018)
    )
    .rename('tempo')
    .toFloat();


    var ndvi = imagem
      .select('NDVI')
      .toFloat();


    return tempo
      .addBands(ndvi)
      .copyProperties(
        imagem,
        [
          'ano',
          'system:time_start'
        ]
      );

  }
);


print(
  'Coleção preparada para tendência espacial:',
  ndviSecoParaTendencia
);


// 16. REGRESSÃO LINEAR PIXEL A PIXEL

// Resultado:
// scale  = inclinação do NDVI por ano
// offset = valor inicial estimado

var regressaoEspacial = ndviSecoParaTendencia
  .select([
    'tempo',
    'NDVI'
  ])
  .reduce(
    ee.Reducer.linearFit()
  );


print(
  'Regressão espacial:',
  regressaoEspacial
);


// Seleciona somente a inclinação
var tendenciaNDVI = regressaoEspacial
  .select('scale')
  .rename('tendencia')
  .clip(df);


// 17. CONTROLE DA QUANTIDADE DE OBSERVAÇÕES

// Conta quantos anos válidos existem em cada pixel
var quantidadeAnosValidos = ndviSecoAnual
  .select('NDVI')
  .count()
  .rename('anos_validos')
  .clip(df);


// Mantém apenas pixels com pelo menos 6 anos válidos
var tendenciaNDVIFiltrada = tendenciaNDVI
  .updateMask(
    quantidadeAnosValidos.gte(6)
  );


print(
  'Quantidade de anos válidos por pixel:',
  quantidadeAnosValidos
);

print(
  'Mapa de tendência filtrado:',
  tendenciaNDVIFiltrada
);


// VISUALIZAÇÃO DO MAPA

var parametrosTendencia = {

  min:
    -0.03,

  max:
    0.03,

  palette: [
    '#B2182B', // vermelho: redução
    '#EF8A62',
    '#F7F7F7', // claro: próximo da estabilidade
    '#67A9CF',
    '#2166AC'  // azul: aumento
  ]

};


Map.addLayer(

  tendenciaNDVIFiltrada,

  parametrosTendencia,

  'Tendência anual do NDVI seco — 2018 a 2025'

);


// Camada auxiliar para conferir a cobertura temporal
Map.addLayer(

  quantidadeAnosValidos,

  {
    min: 6,
    max: 8,
    palette: [
      '#FFF7BC',
      '#FEC44F',
      '#D95F0E'
    ]
  },

  'Quantidade de anos válidos',

  false

);


// Reforça o limite do Distrito Federal
Map.addLayer(

  df.style({

    color:
      '000000',

    fillColor:
      '00000000',

    width:
      2

  }),

  {},

  'Limite do Distrito Federal'

);


// TENDÊNCIA ESPACIAL MÉDIA DO DF

var tendenciaMediaEspacial = tendenciaNDVIFiltrada
  .reduceRegion({

    reducer:
      ee.Reducer.mean(),

    geometry:
      df.geometry(),

    scale:
      30,

    maxPixels:
      1e13,

    bestEffort:
      true

  });


print(
  'Tendência espacial média do DF:',
  tendenciaMediaEspacial
);


// 20. ETAPA 26 — CLASSIFICAÇÃO DAS MUDANÇAS

var variacaoTotalNDVI = tendenciaNDVIFiltrada
  .multiply(7)
  .rename('variacao_total');


// NDVI médio dos oito períodos secos
var ndviMedioOitoAnos = ndviSecoAnual
  .select('NDVI')
  .mean()
  .rename('NDVI_medio')
  .clip(df);


// Máscara operacional de vegetação
var mascaraVegetacao = ndviMedioOitoAnos
  .gte(0.20);


// Combina os critérios de qualidade
var mascaraAnalise = quantidadeAnosValidos
  .gte(6)
  .and(mascaraVegetacao);


// Aplica a máscara à variação total
var variacaoTotalFiltrada = variacaoTotalNDVI
  .updateMask(mascaraAnalise);


// CRIA AS TRÊS CLASSES
// Classe 1 = redução
// Classe 2 = estabilidade
// Classe 3 = aumento
//
// O limite adotado é ±0,05 de NDVI no período.

var classesMudanca = ee.Image.constant(2)

  // Redução
  .where(
    variacaoTotalFiltrada.lt(-0.05),
    1
  )

  // Aumento
  .where(
    variacaoTotalFiltrada.gt(0.05),
    3
  )

  .rename('classe')
  .toByte()
  .updateMask(mascaraAnalise)
  .clip(df);


print(
  'Mapa classificado das mudanças:',
  classesMudanca
);


// MOSTRA O MAPA CLASSIFICADO

Map.addLayer(

  classesMudanca,

  {
    min: 1,
    max: 3,

    palette: [
      '#D73027', // redução
      '#FFF7BC', // estabilidade
      '#1A9850'  // aumento
    ]
  },

  'Classes de mudança do NDVI — 2018 a 2025'

);


// Camada auxiliar com a variação acumulada
Map.addLayer(

  variacaoTotalFiltrada,

  {
    min: -0.20,
    max: 0.20,

    palette: [
      '#B2182B',
      '#EF8A62',
      '#F7F7F7',
      '#67A9CF',
      '#2166AC'
    ]
  },

  'Variação acumulada estimada do NDVI',

  false

);


// CALCULA A ÁREA DE CADA CLASSE

// Área de cada pixel convertida para km²
var areaPixelsKm2 = ee.Image.pixelArea()
  .divide(1000000)
  .rename('area_km2');


// Junta área e classe
var imagemAreaClasses = areaPixelsKm2
  .addBands(classesMudanca);


// Soma as áreas agrupando pelo número da classe
var resultadoAreas = imagemAreaClasses
  .reduceRegion({

    reducer:
      ee.Reducer.sum().group({

        groupField:
          1,

        groupName:
          'classe'

      }),

    geometry:
      df.geometry(),

    scale:
      30,

    maxPixels:
      1e13,

    tileScale:
      4

  });


print(
  'Resultado bruto das áreas:',
  resultadoAreas
);


// ORGANIZA OS RESULTADOS EM UMA TABELA

var gruposAreas = ee.List(
  resultadoAreas.get('groups')
);


// Soma a área total efetivamente analisada
var areaTotalAnalisada = ee.Number(

  gruposAreas.map(function(item) {

    return ee.Dictionary(item)
      .getNumber('sum');

  }).reduce(
    ee.Reducer.sum()
  )

);


var nomesClasses = ee.Dictionary({

  '1':
    'Redução',

  '2':
    'Estabilidade',

  '3':
    'Aumento'

});


var tabelaAreas = ee.FeatureCollection(

  gruposAreas.map(function(item) {

    item = ee.Dictionary(item);

    var numeroClasse = ee.Number(
      item.get('classe')
    );

    var areaKm2 = ee.Number(
      item.get('sum')
    );

    var percentual = areaKm2
      .divide(areaTotalAnalisada)
      .multiply(100);

    var chaveClasse = numeroClasse
      .format('%.0f');


    return ee.Feature(null, {

      'classe':
        numeroClasse,

      'categoria':
        nomesClasses.get(chaveClasse),

      'area_km2':
        areaKm2,

      'percentual':
        percentual

    });

  })

);


print(
  'Área total analisada em km²:',
  areaTotalAnalisada
);

print(
  'Tabela de áreas por classe:',
  tabelaAreas
);


// GRÁFICO DAS ÁREAS

var graficoAreas = ui.Chart.feature.byFeature({

  features:
    tabelaAreas,

  xProperty:
    'categoria',

  yProperties:
    ['area_km2']

})

.setChartType(
  'ColumnChart'
)

.setOptions({

  title:
    'Área por classe de mudança do NDVI — DF',

  hAxis: {
    title:
      'Classe'
  },

  vAxis: {
    title:
      'Área analisada (km²)'
  },

  colors:
    ['#4D4D4D'],

  legend: {
    position:
      'none'
  }

});


print(
  graficoAreas
);


// TÍTULO DO MAPA

var painelTitulo = ui.Panel({

  style: {

    position:
      'top-center',

    padding:
      '8px 15px',

    backgroundColor:
      'rgba(255, 255, 255, 0.90)'

  }

});


var tituloMapa = ui.Label({

  value:
    'Mudanças do NDVI na estação seca — Distrito Federal — 2018 a 2025',

  style: {

    fontSize:
      '18px',

    fontWeight:
      'bold',

    color:
      '#222222',

    margin:
      '0px'

  }

});


var subtituloMapa = ui.Label({

  value:
    'Tendência linear baseada no NDVI médio de julho a setembro',

  style: {

    fontSize:
      '12px',

    color:
      '#555555',

    margin:
      '4px 0px 0px 0px'

  }

});


painelTitulo.add(tituloMapa);
painelTitulo.add(subtituloMapa);

Map.add(painelTitulo);


// LEGENDA DO MAPA

var legenda = ui.Panel({

  style: {

    position:
      'bottom-left',

    padding:
      '10px 15px',

    backgroundColor:
      'rgba(255, 255, 255, 0.92)'

  }

});


var tituloLegenda = ui.Label({

  value:
    'Classes de mudança',

  style: {

    fontWeight:
      'bold',

    fontSize:
      '15px',

    margin:
      '0px 0px 8px 0px'

  }

});


legenda.add(tituloLegenda);


// Função para criar uma linha da legenda
function criarItemLegenda(cor, texto) {

  var caixaCor = ui.Label({

    style: {

      backgroundColor:
        cor,

      padding:
        '9px',

      margin:
        '0px 6px 5px 0px'

    }

  });


  var descricao = ui.Label({

    value:
      texto,

    style: {

      margin:
        '2px 0px 5px 0px',

      fontSize:
        '13px'

    }

  });


  return ui.Panel({

    widgets: [
      caixaCor,
      descricao
    ],

    layout:
      ui.Panel.Layout.Flow('horizontal')

  });

}


// Adiciona os itens
legenda.add(
  criarItemLegenda(
    '#D73027',
    'Redução: mudança < −0,05'
  )
);

legenda.add(
  criarItemLegenda(
    '#FFF7BC',
    'Estabilidade: −0,05 a +0,05'
  )
);

legenda.add(
  criarItemLegenda(
    '#1A9850',
    'Aumento: mudança > +0,05'
  )
);


var observacaoLegenda = ui.Label({

  value:
    'Áreas transparentes: fora da máscara de análise',

  style: {

    fontSize:
      '11px',

    color:
      '#666666',

    margin:
      '6px 0px 0px 0px'

  }

});


legenda.add(observacaoLegenda);

Map.add(legenda);

// ======================================================
// EXPORTAÇÃO DOS RESULTADOS
// ======================================================

// ------------------------------------------------------
// A. MAPA CLASSIFICADO
// ------------------------------------------------------

// Valor 0 representa área não analisada
var classesParaExportar = classesMudanca
  .unmask(0)
  .clip(df);


Export.image.toDrive({

  image:
    classesParaExportar,

  description:
    'NDVI_classes_mudanca_DF_2018_2025',

  folder:
    'Portfolio_GEO_Sentinel2',

  fileNamePrefix:
    'ndvi_classes_mudanca_df_2018_2025',

  region:
    df.geometry(),

  scale:
    30,

  crs:
    'EPSG:31983',

  maxPixels:
    1e13,

  fileFormat:
    'GeoTIFF',

  formatOptions: {

    cloudOptimized:
      true,

    noData:
      0

  }

});


// ------------------------------------------------------
// B. VARIAÇÃO CONTÍNUA DO NDVI
// ------------------------------------------------------

var variacaoParaExportar = variacaoTotalFiltrada
  .unmask(-9999)
  .clip(df);


Export.image.toDrive({

  image:
    variacaoParaExportar,

  description:
    'NDVI_variacao_continua_DF_2018_2025',

  folder:
    'Portfolio_GEO_Sentinel2',

  fileNamePrefix:
    'ndvi_variacao_continua_df_2018_2025',

  region:
    df.geometry(),

  scale:
    30,

  crs:
    'EPSG:31983',

  maxPixels:
    1e13,

  fileFormat:
    'GeoTIFF',

  formatOptions: {

    cloudOptimized:
      true,

    noData:
      -9999

  }

});


// ------------------------------------------------------
// C. TABELA COM AS ÁREAS
// ------------------------------------------------------

Export.table.toDrive({

  collection:
    tabelaAreas,

  description:
    'Tabela_areas_mudanca_NDVI_DF',

  folder:
    'Portfolio_GEO_Sentinel2',

  fileNamePrefix:
    'tabela_areas_mudanca_ndvi_df',

  fileFormat:
    'CSV',

  selectors: [
    'classe',
    'categoria',
    'area_km2',
    'percentual'
  ]

});


// COMPARAÇÃO ENTRE 2018 E 2025

// Seleciona o NDVI seco de 2018
var ndviSeco2018 = ee.Image(

  ndviSecoAnual
    .filter(
      ee.Filter.eq('ano', 2018)
    )
    .first()

)
.select('NDVI')
.rename('NDVI_2018')
.clip(df);


// Seleciona o NDVI seco de 2025
var ndviSeco2025 = ee.Image(

  ndviSecoAnual
    .filter(
      ee.Filter.eq('ano', 2025)
    )
    .first()

)
.select('NDVI')
.rename('NDVI_2025')
.clip(df);


// Aplica a mesma máscara utilizada na análise
ndviSeco2018 = ndviSeco2018
  .updateMask(mascaraAnalise);

ndviSeco2025 = ndviSeco2025
  .updateMask(mascaraAnalise);


// DIFERENÇA DIRETA: 2025 MENOS 2018

var diferencaNDVI2018_2025 = ndviSeco2025
  .subtract(ndviSeco2018)
  .rename('diferenca_NDVI')
  .clip(df);


print(
  'Diferença direta do NDVI — 2025 menos 2018:',
  diferencaNDVI2018_2025
);


// 31. VISUALIZAÇÃO DOS MAPAS
// Mesma escala para os dois anos.

var parametrosNDVI = {

  min:
    0,

  max:
    0.8,

  palette: [
    '#8C510A',
    '#D8B365',
    '#F6E8C3',
    '#C7EAE5',
    '#5AB4AC',
    '#01665E'
  ]

};


Map.addLayer(

  ndviSeco2018,

  parametrosNDVI,

  'NDVI seco — 2018',

  false

);


Map.addLayer(

  ndviSeco2025,

  parametrosNDVI,

  'NDVI seco — 2025',

  false

);


Map.addLayer(

  diferencaNDVI2018_2025,

  {
    min:
      -0.25,

    max:
      0.25,

    palette: [
      '#B2182B',
      '#EF8A62',
      '#F7F7F7',
      '#67A9CF',
      '#2166AC'
    ]
  },

  'Diferença direta — 2025 menos 2018',

  false

);


// NDVI MÉDIO DE CADA ANO

var mediaNDVI2018 = ndviSeco2018
  .reduceRegion({

    reducer:
      ee.Reducer.mean(),

    geometry:
      df.geometry(),

    scale:
      30,

    maxPixels:
      1e13,

    bestEffort:
      true

  });


var mediaNDVI2025 = ndviSeco2025
  .reduceRegion({

    reducer:
      ee.Reducer.mean(),

    geometry:
      df.geometry(),

    scale:
      30,

    maxPixels:
      1e13,

    bestEffort:
      true

  });


var mediaDiferenca = diferencaNDVI2018_2025
  .reduceRegion({

    reducer:
      ee.Reducer.mean(),

    geometry:
      df.geometry(),

    scale:
      30,

    maxPixels:
      1e13,

    bestEffort:
      true

  });


print(
  'NDVI seco médio em 2018:',
  mediaNDVI2018
);

print(
  'NDVI seco médio em 2025:',
  mediaNDVI2025
);

print(
  'Diferença média direta — 2025 menos 2018:',
  mediaDiferenca
);


// EXPORTAÇÃO DOS MAPAS COMPARATIVOS

// ------------------------------------------------------
// A. NDVI SECO DE 2018
// ------------------------------------------------------

Export.image.toDrive({

  image:
    ndviSeco2018.unmask(-9999),

  description:
    'NDVI_seco_DF_2018',

  folder:
    'Portfolio_GEO_Sentinel2',

  fileNamePrefix:
    'ndvi_seco_df_2018',

  region:
    df.geometry(),

  scale:
    30,

  crs:
    'EPSG:31983',

  maxPixels:
    1e13,

  fileFormat:
    'GeoTIFF',

  formatOptions: {

    cloudOptimized:
      true,

    noData:
      -9999

  }

});


// ------------------------------------------------------
// B. NDVI SECO DE 2025
// ------------------------------------------------------

Export.image.toDrive({

  image:
    ndviSeco2025.unmask(-9999),

  description:
    'NDVI_seco_DF_2025',

  folder:
    'Portfolio_GEO_Sentinel2',

  fileNamePrefix:
    'ndvi_seco_df_2025',

  region:
    df.geometry(),

  scale:
    30,

  crs:
    'EPSG:31983',

  maxPixels:
    1e13,

  fileFormat:
    'GeoTIFF',

  formatOptions: {

    cloudOptimized:
      true,

    noData:
      -9999

  }

});


// ------------------------------------------------------
// C. DIFERENÇA DIRETA
// ------------------------------------------------------

Export.image.toDrive({

  image:
    diferencaNDVI2018_2025.unmask(-9999),

  description:
    'Diferenca_NDVI_DF_2018_2025',

  folder:
    'Portfolio_GEO_Sentinel2',

  fileNamePrefix:
    'diferenca_ndvi_df_2018_2025',

  region:
    df.geometry(),

  scale:
    30,

  crs:
    'EPSG:31983',

  maxPixels:
    1e13,

  fileFormat:
    'GeoTIFF',

  formatOptions: {

    cloudOptimized:
      true,

    noData:
      -9999

  }

});

// TABELA DA SÉRIE MENSAL

// Converte a coleção mensal em uma lista
var listaColecaoMensal = ndviMensal2018_2025.toList(
  ndviMensal2018_2025.size()
);


// Para cada imagem mensal, calcula o NDVI médio do DF
var listaTabelaMensal = listaColecaoMensal.map(
  function(item) {

    var imagem = ee.Image(item);

    var ndviMedioMensal = imagem.reduceRegion({

      reducer:
        ee.Reducer.mean(),

      geometry:
        df.geometry(),

      scale:
        30,

      maxPixels:
        1e13,

      bestEffort:
        true

    }).get('NDVI');


    return ee.Feature(null, {

      'data':
        imagem.get('data'),

      'ano':
        imagem.get('ano'),

      'mes':
        imagem.get('mes'),

      'numero_imagens':
        imagem.get('numero_imagens'),

      'NDVI_medio':
        ndviMedioMensal

    });

  }
);


// Converte para FeatureCollection
var tabelaMensalFinal = ee.FeatureCollection(
  listaTabelaMensal
);


print(
  'Tabela mensal final — 2018 a 2025:',
  tabelaMensalFinal
);


// TABELA-RESUMO DOS PRINCIPAIS RESULTADOS

var valor2018 = ee.Number(
  mediaNDVI2018.get('NDVI_2018')
);

var valor2025 = ee.Number(
  mediaNDVI2025.get('NDVI_2025')
);

var diferencaAbsoluta = ee.Number(
  mediaDiferenca.get('diferenca_NDVI')
);


// Mudança percentual tomando 2018 como referência
var diferencaPercentual = diferencaAbsoluta
  .divide(valor2018)
  .multiply(100);


var resumoResultados = ee.FeatureCollection([

  ee.Feature(null, {

    'periodo':
      '2018-2025',

    'meses_analisados':
      'julho-setembro',

    'NDVI_medio_2018':
      valor2018,

    'NDVI_medio_2025':
      valor2025,

    'diferenca_absoluta':
      diferencaAbsoluta,

    'diferenca_percentual':
      diferencaPercentual,

    'tendencia_NDVI_por_ano':
      inclinacao,

    'variacao_estimada_regressao':
      variacaoEstimada,

    'coeficiente_correlacao':
      coeficienteCorrelacao,

    'R_quadrado':
      rQuadrado,

    'area_total_analisada_km2':
      areaTotalAnalisada,

    'limite_estabilidade':
      0.05,

    'NDVI_minimo_mascara':
      0.20

  })

]);


print(
  'Resumo final dos resultados:',
  resumoResultados
);


// 36. EXPORTAÇÃO DAS TABELAS

// ------------------------------------------------------
// A. SÉRIE MENSAL COMPLETA
// ------------------------------------------------------

Export.table.toDrive({

  collection:
    tabelaMensalFinal,

  description:
    'Serie_mensal_NDVI_DF_2018_2025',

  folder:
    'Portfolio_GEO_Sentinel2',

  fileNamePrefix:
    'serie_mensal_ndvi_df_2018_2025',

  fileFormat:
    'CSV',

  selectors: [
    'data',
    'ano',
    'mes',
    'numero_imagens',
    'NDVI_medio'
  ]

});


// ------------------------------------------------------
// B. SÉRIE ANUAL DA ESTAÇÃO SECA
// ------------------------------------------------------

Export.table.toDrive({

  collection:
    tabelaNDVISecoComTempo,

  description:
    'Serie_anual_NDVI_seco_DF_2018_2025',

  folder:
    'Portfolio_GEO_Sentinel2',

  fileNamePrefix:
    'serie_anual_ndvi_seco_df_2018_2025',

  fileFormat:
    'CSV',

  selectors: [
    'ano',
    'tempo',
    'NDVI_seco_medio'
  ]

});


// ------------------------------------------------------
// C. RESUMO DOS RESULTADOS
// ------------------------------------------------------

Export.table.toDrive({

  collection:
    resumoResultados,

  description:
    'Resumo_resultados_NDVI_DF',

  folder:
    'Portfolio_GEO_Sentinel2',

  fileNamePrefix:
    'resumo_resultados_ndvi_df_2018_2025',

  fileFormat:
    'CSV'

});

// Exporta o limite vetorial do Distrito Federal

Export.table.toDrive({

  collection:
    df,

  description:
    'Limite_Distrito_Federal',

  folder:
    'Portfolio_GEO_Sentinel2',

  fileNamePrefix:
    'limite_distrito_federal',

  fileFormat:
    'SHP'

});
