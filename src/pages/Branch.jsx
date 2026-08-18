import { useEffect, useState } from "react";
import {
  getBranches,
  createBranch,
  updateBranch,
  deleteBranch,
  getBranchAccounts
} from "../services/branchApi";

import { getBanks } from "../services/bankApi";
import { hasRole, ROLES } from "../utils/auth";

// Hàm hỗ trợ loại bỏ dấu tiếng Việt và đưa về chữ thường
const removeAccents = (str) => {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
};

function Branch() {
  const canDeleteBranch = hasRole(ROLES.ADMIN);
  const [branches, setBranches] = useState([]);
  const [banks, setBanks] = useState([]);

  const [keyword, setKeyword] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [deleteBranchId, setDeleteBranchId] = useState(null);

  const [newBranch, setNewBranch] = useState({
    name: "",
    address: "",
    phone: "",
    bankId: ""
  });

  const [branchAccounts, setBranchAccounts] = useState([]);
  const [showAccounts, setShowAccounts] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);

  useEffect(() => {
    loadBranches();
    loadBanks();
  }, []);

  const loadBranches = async () => {
    try {
      const response = await getBranches();
      setBranches(response.data);
    } catch (error) {
      console.error("Lỗi khi tải danh sách chi nhánh:", error);
    }
  };

  const loadBanks = async () => {
    try {
      const response = await getBanks();
      setBanks(response.data);
    } catch (error) {
      console.error("Lỗi khi tải danh sách ngân hàng:", error);
    }
  };

  // Save (Tạo mới hoặc Cập nhật)
  const handleSave = async () => {
    try {
      if (editingBranch) {
        const response = await updateBranch(editingBranch.id, newBranch);
        if (response.status === 202) {
          alert(response.data.message);
        }
      } else {
        const response = await createBranch(newBranch);
        if (response.status === 202) {
          alert(response.data.message);
        }
      }

      await loadBranches();

      setShowModal(false);
      setEditingBranch(null);
      setNewBranch({
        name: "",
        address: "",
        phone: "",
        bankId: ""
      });
    } catch (error) {
      console.error(error);
    }
  };

  // Edit (Mở Modal và đổ dữ liệu cần sửa)
  const handleEdit = (branch) => {
    setEditingBranch(branch);
    setNewBranch({
      name: branch.name,
      address: branch.address,
      phone: branch.phone,
      bankId: branch.bankId
    });
    setShowModal(true);
  };

  // Delete (Xóa Branch theo ID)
  const handleDelete = async () => {
    try {
      await deleteBranch(deleteBranchId);
      await loadBranches();
      setDeleteBranchId(null);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete");
    }
  };

  // Mở modal thêm mới
  const handleOpenAddModal = () => {
    setEditingBranch(null);
    setNewBranch({
      name: "",
      address: "",
      phone: "",
      bankId: ""
    });
    setShowModal(true);
  };

  // Lọc không phân biệt dấu và chữ hoa/thường theo: nameBranch, addressBranch, phoneBranch, nameBank
  const filteredBranches = branches.filter((branch) => {
    const cleanKeyword = removeAccents(keyword.trim());

    const bankName = banks.find((bank) => bank.id === branch.bankId)?.name || "";

    const cleanName = removeAccents(branch.name);
    const cleanAddress = removeAccents(branch.address);
    const cleanPhone = removeAccents(branch.phone);
    const cleanBankName = removeAccents(bankName);

    return (
      cleanName.includes(cleanKeyword) ||
      cleanAddress.includes(cleanKeyword) ||
      cleanPhone.includes(cleanKeyword) ||
      cleanBankName.includes(cleanKeyword)
    );
  });

  // Gọi API lấy danh sách tài khoản theo chi nhánh
  const handleViewAccounts = async (branch) => {
    try {
      const accountsResponse = await getBranchAccounts(branch.id);
      setSelectedBranch(branch);
      setBranchAccounts(accountsResponse.data || []);
      setShowAccounts(true);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách tài khoản:", error);
      alert("Không thể tải danh sách tài khoản!");
    }
  };

  return (
    <>
      <h2>Branch Management</h2>

      <div className="toolbar">
        <input
          type="text"
          placeholder="Search"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />

        <button onClick={handleOpenAddModal}>Add Branch</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Address</th>
            <th>Phone</th>
            <th>Bank</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {filteredBranches.map((branch) => (
            <tr key={branch.id}>
              <td>{branch.id}</td>
              <td>{branch.name}</td>
              <td>{branch.address}</td>
              <td>{branch.phone}</td>
              <td>
                {banks.find((bank) => bank.id === branch.bankId)?.name || "Unknown"}
              </td>
              <td>
                <button onClick={() => handleEdit(branch)}>Edit</button>
                {canDeleteBranch && (
                  <button onClick={() => setDeleteBranchId(branch.id)}>Delete</button>
                )}
                <button onClick={() => handleViewAccounts(branch)}>
                  View Accounts
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal Thêm / Sửa Branch */}
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>{editingBranch ? "Edit Branch" : "Add New Branch"}</h3>

            <div>
              <label>Branch Name:</label>
              <input
                placeholder="Branch Name"
                value={newBranch.name}
                onChange={(e) =>
                  setNewBranch({
                    ...newBranch,
                    name: e.target.value
                  })
                }
              />
            </div>

            <div>
              <label>Address:</label>
              <input
                placeholder="Address"
                value={newBranch.address}
                onChange={(e) =>
                  setNewBranch({
                    ...newBranch,
                    address: e.target.value
                  })
                }
              />
            </div>

            <div>
              <label>Phone:</label>
              <input
                placeholder="Phone"
                value={newBranch.phone}
                onChange={(e) =>
                  setNewBranch({
                    ...newBranch,
                    phone: e.target.value
                  })
                }
              />
            </div>

            <div>
              <label>Bank:</label>
              <select
                value={newBranch.bankId}
                disabled={Boolean(editingBranch)}
                onChange={(e) =>
                  setNewBranch({
                    ...newBranch,
                    bankId: e.target.value ? Number(e.target.value) : ""
                  })
                }
              >
                <option value="">Select Bank</option>
                {banks.map((bank) => (
                  <option key={bank.id} value={bank.id}>
                    {bank.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginTop: "15px" }}>
              <button onClick={handleSave}>Save</button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingBranch(null);
                }}
                style={{ marginLeft: "10px" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xác nhận Xóa */}
      {deleteBranchId && (
        <div className="modal">
          <div className="modal-content">
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this branch?</p>
            <div>
              <button onClick={handleDelete}>Yes, Delete</button>
              <button
                onClick={() => setDeleteBranchId(null)}
                style={{ marginLeft: "10px" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Hiển thị Danh sách Accounts */}
      {showAccounts && selectedBranch && (
        <div className="modal">
          <div className="modal-content">
            <h3>Accounts in {selectedBranch.name}</h3>

            {branchAccounts.length === 0 ? (
              <p>No accounts found in this branch.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Account ID</th>
                    <th>Account Number</th>
                    <th>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {branchAccounts.map((account) => (
                    <tr key={account.id}>
                      <td>{account.id}</td>
                      <td>{account.accountNumber || account.number}</td>
                      <td>{account.balance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div style={{ marginTop: "15px" }}>
              <button
                onClick={() => {
                  setShowAccounts(false);
                  setSelectedBranch(null);
                  setBranchAccounts([]);
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

export default Branch;
