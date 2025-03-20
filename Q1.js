document.addEventListener("DOMContentLoaded", () => {
  d3.csv("data.csv").then(function(data) {
    console.log("Dữ liệu đã load:", data);

    if (!data[0]["Thành tiền"] || !data[0]["Tên mặt hàng"]) {
      console.error("⚠️ Tên cột không đúng! Kiểm tra file CSV.");
      return;
    }

    const revenueByItem = d3.rollup(data, 
      v => d3.sum(v, d => +d["Thành tiền"]), 
      d => d["Tên mặt hàng"]
    );

    const dataset = Array.from(revenueByItem, ([item, revenue]) => ({ item, revenue }))
                         .sort((a, b) => d3.descending(a.revenue, b.revenue));

    const margin = { top: 60, right: 100, bottom: 30, left: 200 };
    const width = 1000 - margin.left - margin.right;
    const height = dataset.length * 30;

    const svg = d3.select("#Q1")
      .html("")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

      svg.append("text")
      .attr("x", width / 2)
      .attr("y", -20)
      .attr("text-anchor", "middle")
      .style("font-size", "22px")
      .style("font-weight", "bold")
      .style("fill", "#009688")
      .text("Doanh số bán hàng theo Mặt hàng");

    const y = d3.scaleBand()
      .domain(dataset.map(d => d.item))
      .range([0, height])
      .padding(0.3);

    const x = d3.scaleLinear()
      .domain([0, d3.max(dataset, d => d.revenue)])
      .range([0, width]);

    svg.append("g")
      .call(d3.axisLeft(y).tickSize(0).tickPadding(10))
      .attr("class", "axis-label")
      .selectAll("text")
      .style("font-size", "14px")
      .style("fill", "black");

    svg.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format(",")))
      .selectAll("text")
      .style("font-size", "14px");

    svg.selectAll(".bar")
      .data(dataset)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("y", d => y(d.item))
      .attr("width", d => x(d.revenue))
      .attr("height", y.bandwidth())
      .attr("fill", (d, i) => d3.schemeCategory10[i % 10]);

    svg.selectAll(".label")
      .data(dataset)
      .enter()
      .append("text")
      .attr("x", d => x(d.revenue) + 10)
      .attr("y", d => y(d.item) + y.bandwidth() / 2)
      .attr("dy", ".35em")
      .style("font-size", "14px")
      .style("fill", "black")
      .text(d => d3.format(",.0f")(d.revenue));
  }).catch(error => console.error("Lỗi khi đọc CSV:", error));
});