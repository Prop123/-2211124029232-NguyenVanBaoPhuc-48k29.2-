document.addEventListener("DOMContentLoaded", () => {
    d3.csv("data.csv").then(function(data) {
      console.log("Dữ liệu đã load:", data);
  
      if (!data.length || !data[0]["Tên nhóm hàng"] || !data[0]["Thành tiền"]) {
        console.error("⚠️ Tên cột không đúng hoặc dữ liệu trống! Kiểm tra file CSV.");
        return;
      }
  
      const revenueByCategory = d3.rollup(data, 
        v => d3.sum(v, d => +d["Thành tiền"]), 
        d => d["Tên nhóm hàng"]
      );
  
      const dataset = Array.from(revenueByCategory, ([category, revenue]) => ({ category, revenue }))
                           .sort((a, b) => d3.descending(a.revenue, b.revenue));
  
      const margin = { top: 60, right: 100, bottom: 30, left: 200 };
      const width = 1000 - margin.left - margin.right;
      const height = dataset.length * 100;
  
      // Đảm bảo XÓA biểu đồ cũ trước khi vẽ lại
      d3.select("#Q2").selectAll("svg").remove();
  
      const svg = d3.select("#Q2")
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
        .text("Doanh số bán hàng theo Nhóm hàng");
  
      const y = d3.scaleBand()
        .domain(dataset.map(d => d.category))
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
        .attr("y", d => y(d.category))
        .attr("width", d => x(d.revenue))
        .attr("height", y.bandwidth())
        .attr("fill", (d, i) => d3.schemeCategory10[i % 10]);
    }).catch(error => console.error("❌ Lỗi khi đọc CSV:", error));
  });
