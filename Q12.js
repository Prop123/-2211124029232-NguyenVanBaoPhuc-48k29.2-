document.addEventListener("DOMContentLoaded", () => {
    d3.csv("data.csv").then(function(rawData) {
      // Kiểm tra dữ liệu
      const spendingData = d3.rollup(rawData, 
        values => d3.sum(values, item => +item["Thành tiền"]), 
        item => item["Mã khách hàng"]);
      
      if (spendingData.size === 0) {
        console.error("Dữ liệu chi tiêu không hợp lệ!");
        return;
      }
  
      // Chia dữ liệu thành các bin
      const binSize = 50000;
      const maxSpending = Math.ceil(Math.max(...Array.from(spendingData.values())) / binSize) * binSize;
      
      const bins = Array.from({length: Math.ceil(maxSpending / binSize)}, (_, i) => [i * binSize, (i + 1) * binSize]);
      const spendingBins = new Map(bins.map(bin => [`${bin[0]}-${bin[1]}`, 0]));
  
      spendingData.forEach((total) => {
        const bin = bins.find(b => total >= b[0] && total < b[1]);
        if (bin) {
          spendingBins.set(`${bin[0]}-${bin[1]}`, (spendingBins.get(`${bin[0]}-${bin[1]}`) || 0) + 1);
        }
      });
  
      const dataSet = Array.from(spendingBins, ([spendingRange, count]) => ({ spendingRange, count }));
  
      // Vẽ biểu đồ
      const container = d3.select("#Q12");
      container.selectAll("svg").remove();
  
      const marginConfig = { top: 20, right: 30, bottom: 80, left: 100 };
      const graphWidth = 800 - marginConfig.left - marginConfig.right;
      const graphHeight = 500 - marginConfig.top - marginConfig.bottom;
  
      const svgContainer = d3.select("#Q12")
        .append("svg")
        .attr("width", graphWidth + marginConfig.left + marginConfig.right)
        .attr("height", graphHeight + marginConfig.top + marginConfig.bottom)
        .append("g")
        .attr("transform", `translate(${marginConfig.left}, ${marginConfig.top})`);
  
      svgContainer.append("rect")
        .attr("class", "chart-border")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", graphWidth)
        .attr("height", graphHeight);
  
      const xAxisScale = d3.scaleBand()
        .domain(dataSet.map(item => item.spendingRange))
        .range([0, graphWidth])
        .padding(0.2);
  
      const yAxisScale = d3.scaleLinear()
        .domain([0, d3.max(dataSet, item => item.count)])
        .nice()
        .range([graphHeight, 0]);
  
      svgContainer.append("g")
        .attr("transform", `translate(0, ${graphHeight})`)
        .attr("class", "x-axis")
        .call(d3.axisBottom(xAxisScale))
        .selectAll("text")
        .style("display", "none");
  
      svgContainer.append("g")
        .call(d3.axisLeft(yAxisScale).ticks(5).tickFormat(d3.format(",")));
  
      svgContainer.selectAll(".bar-rect")
        .data(dataSet)
        .enter()
        .append("rect")
        .attr("class", "bar-rect")
        .attr("x", item => xAxisScale(item.spendingRange))
        .attr("y", item => yAxisScale(item.count))
        .attr("width", xAxisScale.bandwidth())
        .attr("height", item => graphHeight - yAxisScale(item.count))
        .append("title")
        .text(item => `Khoảng chi tiêu: ${item.spendingRange}đ, Số khách hàng: ${item.count}`);
    }).catch(error => console.error("Lỗi khi tải CSV:", error));
  });
  