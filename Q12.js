document.addEventListener("DOMContentLoaded", () => {
  d3.csv("data.csv").then(function(data) {
      console.log("Dữ liệu đã load:", data);

      // Validate data
      if (!data.length || !data[0]["Mã khách hàng"] || !data[0]["Thành tiền"]) {
          console.error("\u26a0\ufe0f Tên cột không đúng hoặc dữ liệu trống! Kiểm tra file CSV.");
          return;
      }

      // Calculate total spending per customer
      const totalSpentByCustomer = d3.rollup(
          data,
          v => d3.sum(v, d => +d["Thành tiền"]),
          d => d["Mã khách hàng"]
      );

      // Create bins for spending ranges
      const bins = d3.bin()
          .domain([0, d3.max(totalSpentByCustomer.values())])
          .thresholds(d3.range(0, d3.max(totalSpentByCustomer.values()) + 50000, 50000))
          (Array.from(totalSpentByCustomer.values()));

      // Convert bins into dataset for charting
      const dataset = bins.map(bin => ({
          range: `${(bin.x0 / 1000).toFixed(0)}K`,
          x0: bin.x0,
          x1: bin.x1,
          count: bin.length
      }));

      // Create the chart container
      const container = d3.select("#Q12");
      container.selectAll("svg").remove();

      const chartWidth = 1200, chartHeight = 500;
      const margin = { top: 50, right: 50, bottom: 120, left: 100 };

      const svg = container.append("svg")
          .attr("width", chartWidth + margin.left + margin.right)
          .attr("height", chartHeight + margin.top + margin.bottom)
          .append("g")
          .attr("transform", `translate(${margin.left},${margin.top})`);

      // Draw title
      svg.append("text")
          .attr("x", chartWidth / 2)
          .attr("y", -20)
          .attr("text-anchor", "middle")
          .style("font-size", "20px")
          .style("font-weight", "bold")
          .text("Phân phối Mức chi trả của Khách hàng");

      const x = d3.scaleBand().domain(dataset.map(d => d.range)).range([0, chartWidth]).padding(0.2);
      const y = d3.scaleLinear().domain([0, d3.max(dataset, d => d.count)]).nice().range([chartHeight, 0]);

      // Tooltip
      const tooltip = d3.select("body").append("div")
          .style("position", "absolute")
          .style("background", "#fff")
          .style("border", "1px solid #ddd")
          .style("padding", "10px")
          .style("border-radius", "5px")
          .style("box-shadow", "0px 2px 5px rgba(0, 0, 0, 0.2)")
          .style("font-size", "12px")
          .style("visibility", "hidden");

      // Draw bars
      svg.selectAll(".bar")
          .data(dataset)
          .enter()
          .append("rect")
          .attr("class", "bar")
          .attr("x", d => x(d.range))
          .attr("y", d => y(d.count))
          .attr("width", x.bandwidth())
          .attr("height", d => chartHeight - y(d.count))
          .attr("fill", "#4B8BBE")
          .on("mouseover", function(event, d) {
              tooltip.style("visibility", "visible")
                  .html(`<strong>Chi tiêu từ ${d.x0.toLocaleString()} đến ${d.x1.toLocaleString()}</strong><br><strong>Số lượng khách hàng:</strong> ${d.count}`);
          })
          .on("mousemove", function(event) {
              tooltip.style("top", `${event.pageY - 10}px`)
                  .style("left", `${event.pageX + 10}px`);
          })
          .on("mouseout", function() {
              tooltip.style("visibility", "hidden");
          });

      // Add X and Y axes
      svg.append("g")
          .attr("transform", `translate(0, ${chartHeight})`)
          .call(d3.axisBottom(x))
          .selectAll("text")
          .attr("transform", "rotate(-45)")
          .style("text-anchor", "end");

      svg.append("g")
          .call(d3.axisLeft(y).ticks(6));
  }).catch(error => console.error("\u274c Lỗi khi đọc CSV:", error));
});
