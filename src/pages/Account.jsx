import { getCurrentUser, ROLES } from "../utils/auth";
import Pagination from "../components/Pagination";
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
  const currentUser = getCurrentUser();
  const readOnly = false;
  const [page, setPage] = useState(1);

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
    branchId: "",
    email: ""
  });

  // Step 2: Load danh sách Bank trong useEffect
  useEffect(() => {
    loadAccounts();
    loadBranches();
    loadBanks();
  }, []);

  useEffect(() => {
    if (currentUser?.role === ROLES.BANK && banks.length) setSelectedBank(banks[0].id);
    if (currentUser?.role === ROLES.BRANCH && branches.length) setSelectedBank(branches[0].bankId);
  }, [banks.length, branches.length]);

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
        // Chỉ gửi các trường được phép sửa — không gửi balance / accountNumber
        const payload = {
          ownerName: newAccount.ownerName,
          branchId: newAccount.branchId
        };
        const response = await updateAccount(editingAccount.id, payload);
        if (response.status === 202) {
          alert(response.data.message);
        }
      } else {
        const email = String(newAccount.email || "").trim();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          alert("Email khách hàng là bắt buộc và phải hợp lệ.");
          return;
        }
        const response = await createAccount({ ...newAccount, email });
        if (response.status === 202) {
          alert(response.data.message);
        } else {
          const cl = response.data?.customerLogin;
          if (cl) {
            alert(
              `Tạo tài khoản thành công!\n\n` +
                `Đăng nhập khách hàng:\n` +
                `• Username: ${cl.username}\n` +
                `• Email: ${cl.email || newAccount.email}\n` +
                `• Mật khẩu mặc định: ${cl.defaultPassword}\n\n` +
                `Khách hàng phải đổi mật khẩu sau lần đăng nhập đầu tiên.\n` +
                `Portal: /customer/login`
            );
          }
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
        branchId: "",
        email: ""
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
      branchId: account.branchId,
      email: account.email || ""
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
      branchId: "",
      email: ""
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

  const pagedFilteredaccounts = filteredAccounts.slice((page - 1) * 10, page * 10);

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

        {!readOnly && <button onClick={handleOpenAddModal}>Add Account</button>}
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
          {pagedFilteredaccounts.map((account, index) => (
            <tr key={account.id}>
              <td>{(page - 1) * 10 + index + 1}</td>
              <td>{account.accountNumber}</td>
              <td>{account.ownerName}</td>
              <td>{account.balance}</td>
              <td>
                {branches.find((branch) => branch.id === account.branchId)
                  ?.name || "Unknown"}
              </td>
              <td>
                {!readOnly && <button onClick={() => handleEdit(account)}>Edit</button>}
                {!readOnly && <button onClick={() => setDeleteAccountId(account.id)}>
                  Delete
                </button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
            <Pagination page={page} pageSize={10} total={filteredAccounts.length} onPageChange={setPage} />

      {/* Modal Thêm / Sửa Account */}
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>{editingAccount ? "Edit Account" : "Add New Account"}</h3>

            <div>
              <input
                placeholder="Account Number"
                value={newAccount.accountNumber}
                disabled={!!editingAccount}
                title={editingAccount ? "Số tài khoản không được thay đổi" : ""}
                onChange={(e) =>
                  setNewAccount({
                    ...newAccount,
                    accountNumber: e.target.value
                  })
                }
              />
              {editingAccount && (
                <p className="muted-text" style={{ marginTop: 4, color: "#c62828" }}>
                  Số tài khoản không được thay đổi.
                </p>
              )}
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

            {!editingAccount && (
              <div>
                <input
                  type="email"
                  placeholder="Email khách hàng (bắt buộc)"
                  value={newAccount.email}
                  required
                  onChange={(e) =>
                    setNewAccount({
                      ...newAccount,
                      email: e.target.value
                    })
                  }
                />
                <p className="muted-text" style={{ marginTop: 4, fontSize: 12, color: "#666" }}>
                  Email riêng của tài khoản – dùng để nhận link quên mật khẩu.
                </p>
              </div>
            )}

            <div>
              <input
                type="number"
                placeholder="Balance"
                value={newAccount.balance}
                disabled={!!editingAccount}
                title={editingAccount ? "Số dư chỉ cập nhật qua nạp/rút/chuyển tiền" : ""}
                onChange={(e) =>
                  setNewAccount({
                    ...newAccount,
                    balance: Number(e.target.value)
                  })
                }
              />
              {editingAccount && (
                <p className="muted-text" style={{ marginTop: 4, color: "#ef6c00" }}>
                  Số dư chỉ được cập nhật qua Deposit / Withdraw / Transfer.
                </p>
              )}
            </div>

            {/* Step 4: Dropdown chọn Ngân hàng */}
            {currentUser?.role !== ROLES.BANK && currentUser?.role !== ROLES.BRANCH && (
              <div>
                <label>Bank: </label>
                <select value={selectedBank} disabled={editingAccount !== null || currentUser?.role === ROLES.BRANCH} onChange={(e) => { setSelectedBank(Number(e.target.value)); setNewAccount({ ...newAccount, branchId: "" }); }}>
                  <option value="">Select Bank</option>
                  {banks.map((bank) => <option key={bank.id} value={bank.id}>{bank.name}</option>)}
                </select>
              </div>
            )}

            {/* Step 5: Dropdown chọn Chi nhánh (Đã lọc theo Bank) */}
            <div>
              <label>Branch: </label>
              <select
                value={newAccount.branchId}
                disabled={editingAccount !== null || currentUser?.role === ROLES.BRANCH}
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
