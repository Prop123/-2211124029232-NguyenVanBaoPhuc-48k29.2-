document.addEventListener("DOMContentLoaded", () => {
    d3.csv("data.csv").then(function(data) {
      console.log("Dữ liệu đã load:", data);
  
      if (!data.length || !data[0]["Thời gian tạo đơn"] || !data[0]["Thành tiền"]) {
        console.error("\u26a0\ufe0f Tên cột không đúng hoặc dữ liệu trống! Kiểm tra file CSV.");
        return;
      }
  
      // Chuyển đổi thời gian thành ngày trong tuần
      const parsedData = data.map(d => {
        const date = new Date(d["Thời gian tạo đơn"]);
        return {
          dayOfWeek: date.getDay(), // 0 = Chủ Nhật, 6 = Thứ Bảy
          revenue: +d["Thành tiền"],
          date: date.toISOString().split('T')[0] // Chỉ lấy phần ngày
        };
      });
  
      // Tính tổng doanh thu theo ngày trong tuần
      const groupedByDay = d3.rollups(parsedData, 
        v => ({
          totalRevenue: d3.sum(v, d => d.revenue),
          uniqueDays: new Set(v.map(d => d.date)).size
        }),
        d => d.dayOfWeek
      );
  
      // Tính doanh số trung bình bằng cách chia tổng doanh thu cho số ngày xuất hiện
      const dataset = groupedByDay.map(([day, values]) => ({
        day: ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"][day],
        revenue: values.totalRevenue / values.uniqueDays
      })).sort((a, b) => ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"].indexOf(a.day) - ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"].indexOf(b.day));
  
      const margin = { top: 60, right: 100, bottom: 80, left: 100 };
      const width = 1000 - margin.left - margin.right;
      const height = 500;
  
      d3.select("#Q4").selectAll("svg").remove();
  
      const svg = d3.select("#Q4")
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
        .text("Doanh số bán hàng trung bình theo Ngày trong tuần");
  
      const x = d3.scaleBand()
        .domain(dataset.map(d => d.day))
        .range([0, width])
        .padding(0.3);
  
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
        .call(d3.axisLeft(y).ticks(5).tickFormat(d => d3.format(",.0f")(d / 1e6) + "M "))
        .selectAll("text")
        .style("font-size", "14px");
  
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
        
     svg.selectAll(".label")
        .data(dataset)
        .enter()
        .append("text")
        .attr("x", d => x(d.day) + x.bandwidth() / 2)
        .attr("y", d => y(d.revenue) + 15)
        .attr("text-anchor", "middle")
        .style("font-size", "9px")
        .style("fill", "white")
        .style("font-weight", "bold")
        .text(d => `${d3.format(",.0f")(d.revenue)} VND`);
  
    }).catch(error => console.error("\u274c Lỗi khi đọc CSV:", error));
  });
