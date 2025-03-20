document.addEventListener("DOMContentLoaded", () => {
    d3.csv("data.csv").then(function(data) {
      console.log("Dữ liệu đã load:", data);

      if (!data.length || !data[0]["Thời gian tạo đơn"] || !data[0]["Thành tiền"]) {
        console.error("⚠️ Tên cột không đúng hoặc dữ liệu trống! Kiểm tra file CSV.");
        return;
      }

      // Chuyển đổi dữ liệu ngày tạo đơn và nhóm theo ngày trong tháng
      const parsedData = data.map(d => {
        const date = new Date(d["Thời gian tạo đơn"]);
        return {
          dayOfMonth: date.getDate(),
          revenue: +d["Thành tiền"],
          date: date.toISOString().split('T')[0] // Chỉ lấy phần ngày
        };
      });

      // Tính tổng doanh thu và số ngày duy nhất xuất hiện
      const groupedByDay = d3.rollups(parsedData, 
        v => ({
          totalRevenue: d3.sum(v, d => d.revenue),
          uniqueDays: new Set(v.map(d => d.date)).size
        }),
        d => d.dayOfMonth
      );

      // Tính doanh số trung bình bằng cách chia tổng doanh thu cho số ngày xuất hiện
      const dataset = groupedByDay.map(([day, values]) => ({
        day: `Ngày ${day.toString().padStart(2, '0')}`,
        revenue: (values.totalRevenue / values.uniqueDays) // Doanh số TB
      })).sort((a, b) => a.day.localeCompare(b.day, undefined, { numeric: true }));

      const margin = { top: 60, right: 100, bottom: 100, left: 100 }; // Tăng bottom để có đủ không gian
      const width = 1200 - margin.left - margin.right;
      const height = 600;

      d3.select("#Q5").selectAll("svg").remove();

      const svg = d3.select("#Q5")
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
        .text("Doanh số bán hàng trung bình theo Ngày trong tháng");

      const x = d3.scaleBand()
        .domain(dataset.map(d => d.day))
        .range([0, width])
        .padding(0.3);

      const y = d3.scaleLinear()
        .domain([0, d3.max(dataset, d => d.revenue)])
        .nice()
        .range([height, 0]);

      // Trục X: Định dạng font chữ đẹp như hình
      svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x).tickSize(0).tickPadding(15)) // Tăng padding
        .selectAll("text")
        .style("font-size","Times new Roman", "14px") 
        .style("fill", "black")
        .style("font-weight", "bold")
        .attr("transform", "rotate(-30)") 
        .style("text-anchor", "end");

      // Trục Y
      svg.append("g")
        .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d3.format(",.0f")(d / 1e6)}M `))
        .selectAll("text")
        .style("font-size","Tahoma", "14px");

      // Cột biểu đồ
      svg.selectAll(".bar")
        .data(dataset)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.day))
        .attr("y", d => y(d.revenue))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.revenue))
        .attr("fill", (d, i) => d3.schemeCategory10[i % 10]);

      // Nhãn giá trị trong cột
      svg.selectAll(".label")
        .data(dataset)
        .enter()
        .append("text")
        .attr("x", d => x(d.day) + x.bandwidth() / 2 - 5)
        .attr("y", d => y(d.revenue) + x.bandwidth() / 2 + 1) // Đặt label trong cột
        .attr("text-anchor", "middle")
        .attr("transform", d => `rotate(-90, ${x(d.day) + x.bandwidth() / 2}, ${y(d.revenue) + x.bandwidth() / 2})`) // Xoay chữ theo chiều dọc
        .style("font-size","10px")
        .style("fill", "white")
        .style("font-family", "Arial")
        .text(d => `${(d.revenue / 1e6).toFixed(1)} tr`);

    }).catch(error => console.error("❌ Lỗi khi đọc CSV:", error));
});
