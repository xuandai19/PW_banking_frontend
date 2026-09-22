function ConfirmDialog({
    show,
    title,
    message,
    onConfirm,
    onCancel
}) {

    if (!show) return null;

    return (

        <div className="modal">

            <div className="modal-content">

                <h2>{title}</h2>

                <p>{message}</p>

                <div className="modal-footer">

                    <button onClick={onCancel}>
                        Cancel
                    </button>

                    <button onClick={onConfirm}>
                        Delete
                    </button>

                </div>

            </div>

        </div>

    );

}

export default ConfirmDialog;