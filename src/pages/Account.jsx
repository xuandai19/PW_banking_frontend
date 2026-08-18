import { useEffect, useState } from "react";
import {
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount
} from "../services/accountApi";
import { getBranches } from "../services/branchApi";
import { getBanks } from "../services/bankApi";

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

function Account() {
  const [accounts, setAccounts] = useState([]);
  const [branches, setBranches] = useState([]);

  // Step 1: Thêm state cho Bank
  const [selectedBank, setSelectedBank] = useState("");
  const [banks, setBanks] = useState([]);

  const [keyword, setKeyword] = useState("");

  const [showModal, setShowModal] = useState(false);

  const [editingAccount, setEditingAccount] = useState(null);

  const [deleteAccountId, setDeleteAccountId] = useState(null);

  const [newAccount, setNewAccount] = useState({
    accountNumber: "",
    ownerName: "",
    balance: 0,
    branchId: ""
  });

  // Step 2: Load danh sách Bank trong useEffect
  useEffect(() => {
    loadAccounts();
    loadBranches();
    loadBanks();
  }, []);

  const loadAccounts = async () => {
    try {
      const response = await getAccounts();
      setAccounts(response.data);
    } catch (error) {
      console.error("Lỗi khi tải danh sách account:", error);
    }
  };

  const loadBranches = async () => {
    try {
      const response = await getBranches();
      setBranches(response.data);
    } catch (error) {
      console.error("Lỗi khi tải danh sách branch:", error);
    }
  };

  const loadBanks = async () => {
    try {
      const response = await getBanks();
      setBanks(response.data);
    } catch (error) {
      console.error("Lỗi khi tải danh sách bank:", error);
    }
  };

  // Step 3: Lọc danh sách Chi nhánh theo Ngân hàng đã chọn
  const filteredBranches = branches.filter(
    (branch) => branch.bankId === Number(selectedBank)
  );

  // Save (Tạo mới hoặc Cập nhật)
  const handleSave = async () => {
    try {
      if (editingAccount) {
        const response = await updateAccount(editingAccount.id, newAccount);
        if (response.status === 202) {
          alert(response.data.message);
        }
      } else {
        const response = await createAccount(newAccount);
        if (response.status === 202) {
          alert(response.data.message);
        }
      }

      await loadAccounts();

      setShowModal(false);
      setEditingAccount(null);
      setSelectedBank("");
      setNewAccount({
        accountNumber: "",
        ownerName: "",
        balance: 0,
        branchId: ""
      });
    } catch (error) {
      alert(error.response?.data?.message || "An error occurred");
    }
  };

  // Step 6: Khi sửa Account -> Xác định đúng Bank thuộc Branch hiện tại
  const handleEdit = (account) => {
    setEditingAccount(account);
    setNewAccount({
      accountNumber: account.accountNumber,
      ownerName: account.ownerName,
      balance: account.balance,
      branchId: account.branchId
    });

    const branch = branches.find((item) => item.id === account.branchId);
    setSelectedBank(branch?.bankId || "");

    setShowModal(true);
  };

  // Delete
  const handleDelete = async () => {
    try {
      const response = await deleteAccount(deleteAccountId);
      if (response.status === 202) {
        alert(response.data.message);
      }
      await loadAccounts();
      setDeleteAccountId(null);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete");
    }
  };

  // Mở modal thêm mới (reset form)
  const handleOpenAddModal = () => {
    setEditingAccount(null);
    setSelectedBank("");
    setNewAccount({
      accountNumber: "",
      ownerName: "",
      balance: 0,
      branchId: ""
    });
    setShowModal(true);
  };

  // Lọc danh sách tài khoản theo từ khóa tìm kiếm
  const filteredAccounts = accounts.filter((account) => {
    const cleanKeyword = removeAccents(keyword.trim());

    const cleanAccountNumber = removeAccents(account.accountNumber);
    const cleanOwnerName = removeAccents(account.ownerName);

    const branch = branches.find((b) => b.id === account.branchId);
    const cleanBranchName = removeAccents(branch?.name);

    return (
      cleanAccountNumber.includes(cleanKeyword) ||
      cleanOwnerName.includes(cleanKeyword) ||
      cleanBranchName.includes(cleanKeyword)
    );
  });

  return (
    <>
      <h2>Account Management</h2>

      <div className="toolbar">
        <input
          type="text"
          placeholder="Search"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />

        <button onClick={handleOpenAddModal}>Add Account</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Account Number</th>
            <th>Owner</th>
            <th>Balance</th>
            <th>Branch</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {filteredAccounts.map((account) => (
            <tr key={account.id}>
              <td>{account.id}</td>
              <td>{account.accountNumber}</td>
              <td>{account.ownerName}</td>
              <td>{account.balance}</td>
              <td>
                {branches.find((branch) => branch.id === account.branchId)
                  ?.name || "Unknown"}
              </td>
              <td>
                <button onClick={() => handleEdit(account)}>Edit</button>
                <button onClick={() => setDeleteAccountId(account.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal Thêm / Sửa Account */}
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>{editingAccount ? "Edit Account" : "Add New Account"}</h3>

            <div>
              <input
                placeholder="Account Number"
                value={newAccount.accountNumber}
                onChange={(e) =>
                  setNewAccount({
                    ...newAccount,
                    accountNumber: e.target.value
                  })
                }
              />
            </div>

            <div>
              <input
                placeholder="Owner Name"
                value={newAccount.ownerName}
                onChange={(e) =>
                  setNewAccount({
                    ...newAccount,
                    ownerName: e.target.value
                  })
                }
              />
            </div>

            <div>
              <input
                type="number"
                placeholder="Balance"
                value={newAccount.balance}
                onChange={(e) =>
                  setNewAccount({
                    ...newAccount,
                    balance: Number(e.target.value)
                  })
                }
              />
            </div>

            {/* Step 4: Dropdown chọn Ngân hàng */}
            <div>
              <label>Bank: </label>
              <select
                value={selectedBank}
                disabled={editingAccount !== null}
                onChange={(e) => {
                  const bankId = Number(e.target.value);
                  setSelectedBank(bankId);
                  setNewAccount({
                    ...newAccount,
                    branchId: ""
                  });
                }}
              >
                <option value="">Select Bank</option>
                {banks.map((bank) => (
                  <option key={bank.id} value={bank.id}>
                    {bank.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Step 5: Dropdown chọn Chi nhánh (Đã lọc theo Bank) */}
            <div>
              <label>Branch: </label>
              <select
                value={newAccount.branchId}
                disabled={editingAccount !== null}
                onChange={(e) =>
                  setNewAccount({
                    ...newAccount,
                    branchId: Number(e.target.value)
                  })
                }
              >
                <option value="">Select Branch</option>
                {filteredBranches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginTop: "15px" }}>
              <button onClick={handleSave}>Save</button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingAccount(null);
                  setSelectedBank("");
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
      {deleteAccountId && (
        <div className="modal">
          <div className="modal-content">
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this account?</p>
            <div>
              <button onClick={handleDelete}>Yes, Delete</button>
              <button
                onClick={() => setDeleteAccountId(null)}
                style={{ marginLeft: "10px" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Account;
