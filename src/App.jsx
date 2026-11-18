
import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const getToday = () => {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    return new Date(d.getTime() - offset * 60000)
      .toISOString()
      .slice(0, 10);
  };

  const currentMonth = getToday().slice(0, 7);

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [date, setDate] = useState(getToday());
  const [person, setPerson] = useState("Alvi");
  const [product, setProduct] = useState("");
  const [amount, setAmount] = useState("");
  const [editingKey, setEditingKey] = useState(null);

  const [entries, setEntries] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("monthlyEntries")) || [];
    } catch {
      return [];
    }
  });

  // Save data
  useEffect(() => {
    localStorage.setItem("monthlyEntries", JSON.stringify(entries));
  }, [entries]);

  // Filter selected month
  const filteredEntries = entries.filter(
    (item) => item.date.slice(0, 7) === selectedMonth
  );

  // Group by date and person
  const groupedEntries = filteredEntries.reduce((groups, item) => {
    const key = `${item.date}_${item.person}`;

    if (!groups[key]) {
      groups[key] = {
        key,
        date: item.date,
        person: item.person,
        products: [],
        amounts: [],
        total: 0,
      };
    }

    groups[key].products.push(item.product);
    groups[key].amounts.push(Number(item.amount));
    groups[key].total += Number(item.amount);

    return groups;
  }, {});

  const dailyEntries = Object.values(groupedEntries).sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      a.person.localeCompare(b.person)
  );

  // Person wise totals
  const alviTotal = filteredEntries
    .filter((item) => item.person === "Alvi")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const jubaiyerTotal = filteredEntries
    .filter((item) => item.person === "Jubaiyer")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const total = alviTotal + jubaiyerTotal;

  // Format Taka
  const formatTaka = (value) =>
    new Intl.NumberFormat("en-BD").format(value);

  // Add or Update Product
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!date || !person || !product.trim() || !amount.trim()) {
      alert("Please fill in all fields!");
      return;
    }

    if (date.slice(0, 7) !== selectedMonth) {
      alert("Please select a date from the selected month!");
      return;
    }

    if (editingKey) {
      const products = product
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);

      const amounts = amount
        .split(",")
        .map((a) => a.trim());

      if (
        products.length === 0 ||
        products.length !== amounts.length ||
        amounts.some(
          (a) =>
            a === "" ||
            !Number.isFinite(Number(a)) ||
            Number(a) <= 0
        )
      ) {
        alert(
          "Please enter matching products and amounts.\nExample:\nShirt, Pant\n500, 800"
        );
        return;
      }

      const updatedEntries = products.map((p, index) => ({
        id: crypto.randomUUID(),
        date,
        person,
        product: p,
        amount: Number(amounts[index]),
      }));

      setEntries((prev) => [
        ...prev.filter(
          (item) =>
            `${item.date}_${item.person}` !== editingKey
        ),
        ...updatedEntries,
      ]);

      setEditingKey(null);
    } else {
      if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
        alert("Please enter a valid amount!");
        return;
      }

      const newEntry = {
        id: crypto.randomUUID(),
        date,
        person,
        product: product.trim(),
        amount: Number(amount),
      };

      setEntries((prev) => [...prev, newEntry]);
    }

    setProduct("");
    setAmount("");
  };

  // Edit
  const handleEdit = (item) => {
    setEditingKey(item.key);
    setDate(item.date);
    setPerson(item.person);
    setProduct(item.products.join(", "));
    setAmount(item.amounts.join(", "));

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditingKey(null);
    setProduct("");
    setAmount("");
    setDate(
      getToday().slice(0, 7) === selectedMonth
        ? getToday()
        : selectedMonth + "-01"
    );
    setPerson("Alvi");
  };

  // Delete
  const handleDelete = (key) => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      setEntries((prev) =>
        prev.filter(
          (item) => `${item.date}_${item.person}` !== key
        )
      );

      if (editingKey === key) {
        cancelEdit();
      }
    }
  };

  return (
    <div className="app">
      <div className="container">

        {/* Header */}
        <header className="main-header">
          <div className="header-content">

            <div className="logo-area">
              <div className="logo-icon">৳</div>

              <div>
                <h1>Expense Tracker</h1>
                <p>Personal Monthly Expense Management</p>
              </div>
            </div>

            <div className="header-badge">
              <span className="status-dot"></span>
              Expense Manager
            </div>

          </div>
        </header>

        {/* Month Selector */}
        <section className="month-section">
          <label>Select Month</label>

          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => {
              const month = e.target.value;

              setSelectedMonth(month);

              if (editingKey) {
                cancelEdit();
              }

              if (month) {
                setDate(month + "-01");
              }
            }}
          />
        </section>

        {/* Monthly Total */}
        <section className="total-card">

          <p className="total-heading">Monthly Total</p>

          <div className="person-totals">

            <div className="person-total">
              <span>Alvi Total</span>
              <h3>৳ {formatTaka(alviTotal)}</h3>
            </div>

            <div className="person-total">
              <span>Jubaiyer Total</span>
              <h3>৳ {formatTaka(jubaiyerTotal)}</h3>
            </div>

          </div>

          <div className="combined-total">
            <span>Combined Total</span>
            <h2>৳ {formatTaka(total)}</h2>
          </div>

          <span className="product-count">
            {filteredEntries.length} Products Added
          </span>

        </section>

        {/* Product Form */}
        <section className="form-section">

          <h3>
            {editingKey ? "Edit Product" : "Add New Product"}
          </h3>

          <form onSubmit={handleSubmit}>

            <div className="input-group">
              <label>Select Person</label>

              <select
                value={person}
                onChange={(e) => setPerson(e.target.value)}
                required
              >
                <option value="Alvi">Alvi</option>
                <option value="Jubaiyer">Jubaiyer</option>
              </select>
            </div>

            <div className="input-group">
              <label>Date</label>

              <input
                type="date"
                value={date}
                min={selectedMonth + "-01"}
                max={
                  selectedMonth
                    ? selectedMonth +
                      "-" +
                      new Date(
                        Number(selectedMonth.slice(0, 4)),
                        Number(selectedMonth.slice(5, 7)),
                        0
                      ).getDate()
                    : undefined
                }
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label>Product Name</label>

              <input
                type="text"
                placeholder="Enter product name"
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label>Amount (৳)</label>

              <input
                type="number"
                placeholder="Enter amount"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="submit-btn">
              {editingKey ? "Update Product" : "+ Add Product"}
            </button>

            {editingKey && (
              <button
                type="button"
                className="cancel-btn"
                onClick={cancelEdit}
              >
                Cancel
              </button>
            )}

          </form>

          {editingKey && (
            <p className="edit-hint">
              Edit mode: Separate multiple products and amounts
              with commas in matching order.
            </p>
          )}

        </section>

        {/* Product History */}
        <section className="table-section">

          <div className="table-heading">
            <div>
              <h3>Product History</h3>
              <p>Daily product and expense records</p>
            </div>

            <span className="record-badge">
              {dailyEntries.length} Records
            </span>
          </div>

          <div className="table-wrapper">
            <table>

              <thead>
                <tr>
                  <th>Date</th>
                  <th>Name</th>
                  <th>Product Name</th>
                  <th>Amount (৳)</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>

                {dailyEntries.length > 0 ? (

                  dailyEntries.map((item) => (
                    <tr key={item.key}>

                      <td>{item.date}</td>

                      <td>
                        <strong className={
                          item.person === "Alvi"
                            ? "alvi-name"
                            : "jubaiyer-name"
                        }>
                          {item.person}
                        </strong>
                      </td>

                      <td>{item.products.join(", ")}</td>

                      <td>
                        {item.amounts
                          .map((a) => formatTaka(a))
                          .join(" + ")}
                      </td>

                      <td>
                        <div className="action-buttons">

                          <button
                            className="edit-btn"
                            onClick={() => handleEdit(item)}
                          >
                            Edit
                          </button>

                          <button
                            className="delete-btn"
                            onClick={() => handleDelete(item.key)}
                          >
                            Delete
                          </button>

                        </div>
                      </td>

                    </tr>
                  ))

                ) : (

                  <tr>
                    <td colSpan="5" className="empty">
                      No products added for this month.
                    </td>
                  </tr>

                )}

              </tbody>

              <tfoot>
                <tr>
                  <td colSpan="3">Monthly Total</td>
                  <td colSpan="2">৳ {formatTaka(total)}</td>
                </tr>
              </tfoot>

            </table>
          </div>
        </section>

        {/* Footer */}
        <footer className="main-footer">

          <div className="footer-content">

            <div>
              <h3>Expense Tracker</h3>
              <p>
                Track your expenses. Manage your money wisely.
              </p>
            </div>

            <div className="footer-right">
              <span>Made with ❤️</span>
              <p>© 2026 Expense Tracker. All rights reserved.</p>
            </div>

          </div>

        </footer>

      </div>
    </div>
  );
}

export default App;