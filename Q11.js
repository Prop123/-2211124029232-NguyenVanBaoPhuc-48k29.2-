document.addEventListener("DOMContentLoaded", () => {
    d3.csv("data.csv").then(function(rawData) {
      const orderFrequency = d3.rollup(
        rawData,
        orderSet => new Set(orderSet.map(item => item["Mã đơn hàng"])).size,
        item => item["Mã khách hàng"]
      );
  
      const purchaseStats = d3.rollup(
        Array.from(orderFrequency.values()),
        freq => freq.length,
        numOrders => numOrders
      );
  
      const dataSet = Array.from(purchaseStats, ([orderCount, customerCount]) => ({ 
        orderCount: +orderCount, 
        customerCount: +customerCount 
      })).sort((a, b) => a.orderCount - b.orderCount);
  
      const marginConfig = { top: 20, right: 30, bottom: 50, left: 100 };
      const graphWidth = 800 - marginConfig.left - marginConfig.right;
      const graphHeight = 500 - marginConfig.top - marginConfig.bottom;
  
      const svgContainer = d3.select("#Q11")
        .append("svg")
        .attr("width", graphWidth + marginConfig.left + marginConfig.right)
        .attr("height", graphHeight + marginConfig.top + marginConfig.bottom)
        .append("g")
        .attr("transform", `translate(${marginConfig.left}, ${marginConfig.top})`);
  
      const xAxisScale = d3.scaleBand()
        .domain(dataSet.map(item => item.orderCount))
        .range([0, graphWidth])
        .padding(0.2);
  
      const yAxisScale = d3.scaleLinear()
        .domain([0, d3.max(dataSet, item => item.customerCount)])
        .nice()
        .range([graphHeight, 0]);
  
      svgContainer.append("g")
        .attr("transform", `translate(0, ${graphHeight})`)
        .attr("class", "x-axis")
        .call(d3.axisBottom(xAxisScale).tickFormat(item => item))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("transform", "rotate(-35)");
  
      svgContainer.append("g")
        .call(d3.axisLeft(yAxisScale).ticks(5).tickFormat(d3.format(",")));
  
      svgContainer.selectAll(".bar-rect")
        .data(dataSet)
        .enter()
        .append("rect")
        .attr("class", "bar-rect")
        .attr("x", item => xAxisScale(item.orderCount))
        .attr("y", item => yAxisScale(item.customerCount))
        .attr("width", xAxisScale.bandwidth())
        .attr("height", item => graphHeight - yAxisScale(item.customerCount))
        .append("title")
        .text(item => `Số lượt mua: ${item.orderCount}, Số khách hàng: ${item.customerCount}`);
    }).catch(error => console.error("Lỗi tải dữ liệu CSV:", error));
  });
  