# Monitoramento multitemporal da vegetação no Distrito Federal

Análise da dinâmica do NDVI no Distrito Federal entre 2018 e 2025, utilizando imagens Sentinel-2 e processamento no Google Earth Engine.

## Objetivo

Avaliar a evolução da vegetação durante a estação seca, entre julho e setembro, identificando espacialmente áreas de redução, estabilidade e aumento do NDVI.

## Tecnologias utilizadas

- Google Earth Engine
- JavaScript
- Sentinel-2 SR Harmonized
- QGIS
- Sensoriamento remoto
- Análise espacial

## Metodologia

1. Seleção das imagens Sentinel-2 entre 2018 e 2025.
2. Remoção de nuvens e sombras utilizando a banda SCL.
3. Cálculo do NDVI.
4. Criação de composições para a estação seca.
5. Regressão linear temporal por pixel.
6. Classificação das áreas em redução, estabilidade e aumento.
7. Produção dos mapas no QGIS.

## Principais resultados

A tendência média estimada do NDVI foi de aproximadamente -0,00388 por ano. Entre 2018 e 2025, a variação média foi de aproximadamente -0,027.

As áreas analisadas foram classificadas em:

- Redução do NDVI: 1.718,22 km² — 33,06%;
- Estabilidade: 2.850,41 km² — 54,85%;
- Aumento do NDVI: 628,04 km² — 12,09%.

## Arquivos

- [`codigo/monitoramento_ndvi_df.js`](codigo/monitoramento_ndvi_df.js): código utilizado no Google Earth Engine;
- [`documento/estudo-ndvi-distrito-federal.pdf`](documento/estudo-ndvi-distrito-federal.pdf): estudo de caso completo;
- `resultados/`: mapas e gráficos produzidos.

## Autoria

**Ivana Bezerra**

- [LinkedIn](https://www.linkedin.com/in/ivana-bezerra-765650332)
- E-mail: ivana.f.bezerra@gmail.com
