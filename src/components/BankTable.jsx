function BankTable({ banks, onEdit, onDelete }) {

    return (

        <table>

            <thead>

                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Address</th>
                    <th>Action</th>
                </tr>

            </thead>

            <tbody>

                {
                    banks.map(bank => (

                        <tr key={bank.id}>

                            <td>{bank.id}</td>

                            <td>{bank.name}</td>

                            <td>{bank.address}</td>

                            <td>

                                <button onClick={() => onEdit(bank)}>
                                    Edit
                                </button>

                                <button onClick={() => onDelete(bank.id)}>
                                    Delete
                                </button>

                            </td>

                        </tr>

                    ))
                }

            </tbody>

        </table>

    );

}

export default BankTable;