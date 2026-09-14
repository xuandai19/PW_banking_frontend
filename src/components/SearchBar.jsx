function SearchBar({ keyword, setKeyword, onAdd }) {
    return (
        <div className="toolbar">

            <input
                type="text"
                placeholder="Search..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
            />

            <button onClick={onAdd}>
                Add Bank
            </button>

        </div>
    );
}

export default SearchBar;