document.addEventListener("DOMContentLoaded", () => {
  d3.csv("data.csv").then(function(data) {
      console.log("Dữ liệu đã load:", data);

      // Validate data
      if (!data.length || !data[0]["Mã khách hàng"] || !data[0]["Mã đơn hàng"]) {
          console.error("\u26a0\ufe0f Tên cột không đúng hoặc dữ liệu trống! Kiểm tra file CSV.");
          return;
      }

      // Process data
      const purchaseFrequency = d3.rollup(
          data,
          v => new Set(v.map(d => d["Mã đơn hàng"])).size, // Frequency of purchases
          d => d["Mã khách hàng"]
      );

      const customerCountByPurchases = d3.rollup(
          [...purchaseFrequency.values()],
          v => v.length,
          d => d
      );

      let dataset = Array.from(customerCountByPurchases, ([purchases, customers]) => ({
          purchases: +purchases,
          customers: +customers
      })).sort((a, b) => d3.ascending(a.purchases, b.purchases));

      // Create the chart container
      const container = d3.select("#Q11");
      container.selectAll("svg").remove();

      const chartWidth = 1000, chartHeight = 500;
      const margin = { top: 50, right: 50, bottom: 50, left: 100 };

      const svg = container.append("svg")
          .attr("width", chartWidth + margin.left + margin.right)
          .attr("height", chartHeight + margin.top + margin.bottom)
          .append("g")
          .attr("transform", `translate(${margin.left},${margin.top})`);

      // Draw the title
      svg.append("text")
          .attr("x", chartWidth / 2)
          .attr("y", -10)
          .attr("text-anchor", "middle")
          .style("font-size", "20px")
          .style("font-weight", "bold")
          .text("Phân phối Lượt mua hàng");

      const x = d3.scaleBand().domain(dataset.map(d => d.purchases)).range([0, chartWidth]).padding(0.2);
      const y = d3.scaleLinear().domain([0, d3.max(dataset, d => d.customers)]).nice().range([chartHeight, 0]);

      // Tooltip
      const tooltip = d3.select("body").append("div")
          .style("position", "absolute")
          .style("background", "rgba(0, 0, 0, 0.7)")
          .style("color", "#fff")
          .style("padding", "8px")
          .style("border-radius", "5px")
          .style("font-size", "12px")
          .style("visibility", "hidden");

      // Draw bars
      svg.selectAll(".bar")
          .data(dataset)
          .enter()
          .append("rect")
          .attr("class", "bar")
          .attr("x", d => x(d.purchases))
          .attr("y", d => y(d.customers))
          .attr("width", x.bandwidth())
          .attr("height", d => chartHeight - y(d.customers))
          .attr("fill", "#4B8BBE")
          .on("mouseover", function(event, d) {
              tooltip.style("visibility", "visible")
                  .html(`<strong>Đã mua ${d.purchases} lần</strong><br><strong>Số lượng KH:</strong> ${d.customers}`);
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
          .call(d3.axisBottom(x));

      svg.append("g")
          .call(d3.axisLeft(y).ticks(6));
  }).catch(error => console.error("\u274c Lỗi khi đọc CSV:", error));
});
