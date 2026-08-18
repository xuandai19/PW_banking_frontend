import { useState, useEffect } from "react";
import {
  getBanks,
  createBank,
  updateBank,
  deleteBank,
  getBankBranches
} from "../services/bankApi";

// Hàm hỗ trợ loại bỏ dấu tiếng Việt và chuyển về chữ thường
const removeAccents = (str) => {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
};

function Bank() {
  const [banks, setBanks] = useState([]);
  const [keyword, setKeyword] = useState("");

  const [showModal, setShowModal] = useState(false);

  const [newBank, setNewBank] = useState({
    name: "",
    code: "",
    address: ""
  });

  const [editingBank, setEditingBank] = useState(null);
  const [deleteBankId, setDeleteBankId] = useState(null);

  // States quản lý chi nhánh ngân hàng
  const [selectedBank, setSelectedBank] = useState(null);
  const [bankBranches, setBankBranches] = useState([]);
  const [showBranches, setShowBranches] = useState(false);

  // Lấy danh sách Bank từ backend khi component mount
  useEffect(() => {
    loadBanks();
  }, []);

  const loadBanks = async () => {
    try {
      const response = await getBanks();
      setBanks(response.data || []);
    } catch (error) {
      console.error("Lỗi khi tải danh sách bank:", error);
    }
  };

  // Lọc không phân biệt dấu tiếng Việt và chữ hoa/thường
  const filteredBanks = banks.filter((bank) => {
    const cleanKeyword = removeAccents(keyword.trim());

    const cleanName = removeAccents(bank.name);
    const cleanCode = removeAccents(bank.code);
    const cleanAddress = removeAccents(bank.address);

    return (
      cleanName.includes(cleanKeyword) ||
      cleanCode.includes(cleanKeyword) ||
      cleanAddress.includes(cleanKeyword)
    );
  });

  // Xử lý Add và Update với Backend
  const handleSave = async () => {
    if (!newBank.name || !newBank.code || !newBank.address) {
      alert("Please enter all fields");
      return;
    }

    try {
      if (editingBank) {
        // Update Bank
        await updateBank(editingBank.id, newBank);
      } else {
        // Add Bank
        await createBank(newBank);
      }

      // Tải lại danh sách mới nhất từ server
      await loadBanks();

      // Reset form & state
      setEditingBank(null);
      setNewBank({
        name: "",
        code: "",
        address: ""
      });
      setShowModal(false);
    } catch (error) {
      console.error(error);
      alert(
        error.response?.data?.message ||
          error.message ||
          "Đã có lỗi xảy ra khi lưu!"
      );
    }
  };

  const handleEdit = (bank) => {
    setEditingBank(bank);

    setNewBank({
      name: bank.name,
      code: bank.code,
      address: bank.address
    });

    setShowModal(true);
  };

  // Delete Bank
  const handleDelete = async () => {
    if (!deleteBankId) return;

    try {
      await deleteBank(deleteBankId);
      await loadBanks(); // Tải lại danh sách sau khi xoá thành công
      setDeleteBankId(null);
    } catch (error) {
      console.error("Lỗi khi xoá bank:", error);
      alert("Đã có lỗi xảy ra khi xoá!");
    }
  };

  // Hàm xử lý xem chi nhánh ngân hàng
  const handleViewBranches = async (bank) => {
    try {
      const branchesResponse = await getBankBranches(bank.id);
      setSelectedBank(bank);
      setBankBranches(branchesResponse.data || []);
      setShowBranches(true);
    } catch (error) {
      console.error("Lỗi khi tải chi nhánh ngân hàng:", error);
      alert("Không thể lấy danh sách chi nhánh!");
    }
  };

  return (
    <>
      <h2>Bank Management</h2>

      <div className="toolbar">
        <input
          type="text"
          placeholder="Search"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />

        <button onClick={() => setShowModal(true)}>Add Bank</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Code</th>
            <th>Address</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {filteredBanks.map((bank) => (
            <tr key={bank.id}>
              <td>{bank.id}</td>
              <td>{bank.name}</td>
              <td>{bank.code}</td>
              <td>{bank.address}</td>
              <td>
                <button onClick={() => handleEdit(bank)}>Edit</button>
                <button onClick={() => setDeleteBankId(bank.id)}>Delete</button>
                <button onClick={() => handleViewBranches(bank)}>View Branches</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal Thêm / Sửa Ngân Hàng */}
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>{editingBank ? "Update Bank" : "Add New Bank"}</h2>

            <input
              type="text"
              placeholder="Bank name"
              value={newBank.name}
              onChange={(e) =>
                setNewBank({
                  ...newBank,
                  name: e.target.value
                })
              }
            />

            <input
              type="text"
              placeholder="Bank code"
              value={newBank.code}
              onChange={(e) =>
                setNewBank({
                  ...newBank,
                  code: e.target.value
                })
              }
            />

            <input
              type="text"
              placeholder="Address"
              value={newBank.address}
              onChange={(e) =>
                setNewBank({
                  ...newBank,
                  address: e.target.value
                })
              }
            />

            <div className="modal-footer">
              <button onClick={handleSave}>Save</button>

              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingBank(null);
                  setNewBank({
                    name: "",
                    code: "",
                    address: ""
                  });
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xác Nhận Xoá Ngân Hàng */}
      {deleteBankId && (
        <div className="modal">
          <div className="modal-content">
            <h2>Delete Bank</h2>

            <p>Are you sure you want to delete this bank?</p>

            <div className="modal-footer">
              <button onClick={() => setDeleteBankId(null)}>Cancel</button>
              <button onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xem Danh Sách Chi Nhánh */}
      {showBranches && selectedBank && (
        <div className="modal">
          <div className="modal-content">
            <h3>Branches of {selectedBank.name}</h3>

            {bankBranches.length === 0 ? (
              <p>No branches found.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Branch ID</th>
                    <th>Branch Name</th>
                    <th>Address</th>
                  </tr>
                </thead>
                <tbody>
                  {bankBranches.map((branch) => (
                    <tr key={branch.id}>
                      <td>{branch.id}</td>
                      <td>{branch.name}</td>
                      <td>{branch.address}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="modal-footer">
              <button
                onClick={() => {
                  setShowBranches(false);
                  setSelectedBank(null);
                  setBankBranches([]);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Bank;