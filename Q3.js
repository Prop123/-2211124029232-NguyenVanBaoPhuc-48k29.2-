document.addEventListener("DOMContentLoaded", () => {
    d3.csv("data.csv").then(function(data) {
      console.log("Dữ liệu đã load:", data);
  
      if (!data.length || !data[0]["Thời gian tạo đơn"] || !data[0]["Thành tiền"]) {
        console.error("⚠️ Tên cột không đúng hoặc dữ liệu trống! Kiểm tra file CSV.");
        return;
      }
  
      // Chuyển đổi cột thời gian sang tháng
      const revenueByMonth = d3.rollup(data, 
        v => d3.sum(v, d => +d["Thành tiền"]), 
        d => {
          const date = new Date(d["Thời gian tạo đơn"]);
          return `Tháng ${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        }
      );
  
      const dataset = Array.from(revenueByMonth, ([month, revenue]) => ({ month, revenue }))
                           .sort((a, b) => d3.ascending(a.month, b.month));
  
      const margin = { top: 40, right: 50, bottom: 50, left: 100 };
      const width = 1000 - margin.left - margin.right;
      const height = 600;
  
      // Đảm bảo XÓA biểu đồ cũ trước khi vẽ lại
      d3.select("#Q3").selectAll("svg").remove();
  
      const svg = d3.select("#Q3")
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
        .style("fill", "teal")
        .text("Doanh số bán hàng theo Tháng");
  
      const x = d3.scaleBand()
        .domain(dataset.map(d => d.month))
        .range([0, width])
        .padding(0.2);
  
      const y = d3.scaleLinear()
        .domain([0, d3.max(dataset, d => d.revenue)])
        .nice()
        .range([height, 0]);
  
      svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x).tickSize(0).tickPadding(10))
        .selectAll("text")
        .style("font-size", "14px")
        .style("fill", "black");
  
      svg.append("g")
        .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d3.format(",.0f")(d / 1e6)}M`))
        .selectAll("text")
        .style("font-size", "14px");
  
      svg.selectAll(".bar")
        .data(dataset)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.month))
        .attr("y", d => y(d.revenue))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.revenue))
        .attr("fill", (d, i) => d3.schemeCategory10[i % 10]);
  
      svg.selectAll(".label")
        .data(dataset)
        .enter()
        .append("text")
        .attr("x", d => x(d.month) + x.bandwidth() / 2)
        .attr("y", d => y(d.revenue) + 15)
        .attr("text-anchor", "middle")
        .style("font-size", "9px")
        .style("fill", "white")
        .text(d => `${d3.format(",.0f")(d.revenue / 1e6)} triệu VND`);
    }).catch(error => console.error("❌ Lỗi khi đọc CSV:", error));
  });
