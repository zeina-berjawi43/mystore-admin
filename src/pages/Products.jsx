
import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import "./Products.css";

const API_URL = "https://mystore-backend-u6ey.onrender.com";

function Products() {
  // ============================================================
  // STATE
  // ============================================================

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ============================================================
  // FILTERS
  // ============================================================

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [availabilityFilter, setAvailabilityFilter] =
    useState("");

  // ============================================================
  // MODAL
  // ============================================================

  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] =
    useState(null);

  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] =
    useState(false);

  // ============================================================
  // IMAGE
  // ============================================================

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] =
    useState("");

  const [isDraggingImage, setIsDraggingImage] =
    useState(false);

  // ============================================================
  // UPDATE STATES
  // ============================================================

  const [updatingAvailability, setUpdatingAvailability] =
    useState({});

  const [updatingDiscount, setUpdatingDiscount] =
    useState({});

  const [updatingPrice, setUpdatingPrice] =
    useState({});

  // ============================================================
  // FORM
  // ============================================================

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    discount: 0,
    image: "",
    category: "",
    brand: "",
    availability: true,
  });

  const firstFilterRender = useRef(true);

  // ============================================================
  // TOKEN
  // ============================================================

  const getToken = () => {
    return localStorage.getItem("accessToken");
  };

  // ============================================================
  // HEADERS
  // ============================================================

  const getHeaders = () => {
    const token = getToken();

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  // ============================================================
  // IMAGE URL
  // ============================================================

  const getImageUrl = (image) => {
    if (!image) {
      return "";
    }

    if (
      image.startsWith("http://") ||
      image.startsWith("https://") ||
      image.startsWith("blob:")
    ) {
      return image;
    }

    if (image.startsWith("/")) {
      return `${API_URL}${image}`;
    }

    return `${API_URL}/${image}`;
  };

  // ============================================================
  // CATEGORIES
  // ============================================================

  const fetchCategories = async () => {
    try {
      const response = await fetch(
        `${API_URL}/categories`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load categories"
        );
      }

      setCategories(data.categories || []);
    } catch (error) {
      console.log("CATEGORIES ERROR:", error);
    }
  };

  // ============================================================
  // BRANDS
  // ============================================================

  const fetchBrands = async () => {
    try {
      const response = await fetch(
        `${API_URL}/brands`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load brands"
        );
      }

      setBrands(data.brands || []);
    } catch (error) {
      console.log("BRANDS ERROR:", error);
    }
  };

  // ============================================================
  // PRODUCTS
  // ============================================================

  const fetchProducts = async (
    showInitialLoading = false
  ) => {
    try {
      if (showInitialLoading) {
        setLoading(true);
      }

      setError("");

      const params = new URLSearchParams();

      if (search.trim()) {
        params.append("search", search.trim());
      }

      if (categoryFilter) {
        params.append(
          "category",
          categoryFilter
        );
      }

      if (brandFilter) {
        params.append("brand", brandFilter);
      }

      if (availabilityFilter !== "") {
        params.append(
          "availability",
          availabilityFilter
        );
      }

      const url =
        `${API_URL}/products/admin/all` +
        (
          params.toString()
            ? `?${params.toString()}`
            : ""
        );

      const response = await fetch(url, {
        method: "GET",
        headers: getHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load products"
        );
      }

      setProducts(data.products || []);
    } catch (error) {
      console.log("PRODUCTS ERROR:", error);

      setError(
        error.message ||
          "Failed to load products"
      );
    } finally {
      if (showInitialLoading) {
        setLoading(false);
      }
    }
  };

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    fetchCategories();
    fetchBrands();
    fetchProducts(true);
  }, []);

  // ============================================================
  // FILTER EFFECT
  // ============================================================

  useEffect(() => {
    if (firstFilterRender.current) {
      firstFilterRender.current = false;
      return;
    }

    const timer = setTimeout(() => {
      fetchProducts(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [
    search,
    categoryFilter,
    brandFilter,
    availabilityFilter,
  ]);

  // ============================================================
  // FORM CHANGE
  // ============================================================

  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  // ============================================================
  // VALIDATE IMAGE
  // ============================================================

  const validateImage = (file) => {
    if (!file) {
      return false;
    }

    if (!file.type.startsWith("image/")) {
      alert(
        "Please select an image file."
      );

      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert(
        "Image size must be less than 5MB."
      );

      return false;
    }

    return true;
  };

  // ============================================================
  // SET IMAGE
  // ============================================================

  const setSelectedImage = (file) => {
    if (!file) {
      return;
    }

    if (!validateImage(file)) {
      return;
    }

    if (
      imagePreview &&
      imagePreview.startsWith("blob:")
    ) {
      URL.revokeObjectURL(imagePreview);
    }

    setImageFile(file);

    const preview =
      URL.createObjectURL(file);

    setImagePreview(preview);
  };

  // ============================================================
  // IMAGE CHANGE
  // ============================================================

  const handleImageChange = (event) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setSelectedImage(file);

    event.target.value = "";
  };

  // ============================================================
  // IMAGE DRAG EVENTS
  // ============================================================

  const handleImageDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!saving && !uploadingImage) {
      setIsDraggingImage(true);
    }
  };

  const handleImageDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();

    setIsDraggingImage(false);
  };

  const handleImageDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();

    setIsDraggingImage(false);

    if (saving || uploadingImage) {
      return;
    }

    const file =
      event.dataTransfer.files?.[0];

    if (!file) {
      return;
    }

    setSelectedImage(file);
  };

  // ============================================================
  // UPLOAD IMAGE
  // ============================================================

  const uploadImage = async () => {
    if (!imageFile) {
      return form.image;
    }

    try {
      setUploadingImage(true);

      const formData = new FormData();

      formData.append(
        "image",
        imageFile
      );

      const token = getToken();

      const response = await fetch(
        `${API_URL}/upload/image`,
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${token}`,
          },

          body: formData,
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to upload image."
        );
      }

      if (!data.image) {
        throw new Error(
          "Image upload succeeded but no image was returned."
        );
      }

      return data.image;
    } catch (error) {
      console.log(
        "UPLOAD IMAGE ERROR:",
        error
      );

      throw error;
    } finally {
      setUploadingImage(false);
    }
  };

  // ============================================================
  // RESET
  // ============================================================

  const resetForm = () => {
    if (
      imagePreview &&
      imagePreview.startsWith("blob:")
    ) {
      URL.revokeObjectURL(imagePreview);
    }

    setForm({
      name: "",
      description: "",
      price: "",
      discount: 0,
      image: "",
      category: "",
      brand: "",
      availability: true,
    });

    setImageFile(null);
    setImagePreview("");
    setIsDraggingImage(false);
  };

  // ============================================================
  // OPEN ADD
  // ============================================================

  const openAddModal = () => {
    setEditingProduct(null);
    resetForm();
    setShowModal(true);
  };

  // ============================================================
  // OPEN EDIT
  // ============================================================

  const openEditModal = (product) => {
    setEditingProduct(product);

    setImageFile(null);

    setImagePreview(
      getImageUrl(product.image)
    );

    setForm({
      name: product.name || "",

      description:
        product.description || "",

      price:
        product.price ?? "",

      discount:
        product.discount ?? 0,

      image:
        product.image || "",

      category:
        product.category?._id ||
        product.category ||
        "",

      brand:
        product.brand?._id ||
        product.brand ||
        "",

      availability:
        product.availability !== false,
    });

    setShowModal(true);
  };

  // ============================================================
  // CLOSE
  // ============================================================

  const closeModal = () => {
    if (
      saving ||
      uploadingImage
    ) {
      return;
    }

    setShowModal(false);
    setEditingProduct(null);
    resetForm();
  };

  // ============================================================
  // CALCULATE FINAL PRICE
  // ============================================================

  const calculateDiscountedPrice = (
    price,
    discount
  ) => {
    const originalPrice =
      Number(price) || 0;

    const discountPercentage =
      Number(discount) || 0;

    return (
      originalPrice -
      (
        originalPrice *
        discountPercentage
      ) /
        100
    );
  };

  // ============================================================
  // ADD / EDIT
  // ============================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      !form.name.trim() ||
      form.price === "" ||
      (
        !form.image &&
        !imageFile
      ) ||
      !form.category ||
      !form.brand
    ) {
      alert(
        "Please fill all required fields."
      );

      return;
    }

    const price =
      Number(form.price);

    const discount =
      Number(form.discount) || 0;

    if (
      isNaN(price) ||
      price < 0
    ) {
      alert(
        "Price cannot be negative."
      );

      return;
    }

    if (
      discount < 0 ||
      discount > 100
    ) {
      alert(
        "Discount must be between 0% and 100%."
      );

      return;
    }

    try {
      setSaving(true);

      let imageURL = form.image;

      if (imageFile) {
        imageURL =
          await uploadImage();
      }

      if (!imageURL) {
        throw new Error(
          "Please select an image."
        );
      }

      const body = {
        name: form.name.trim(),

        description:
          form.description.trim(),

        price,

        discount,

        image: imageURL,

        category: form.category,

        brand: form.brand,

        availability:
          form.availability,
      };

      let url;
      let method;

      if (editingProduct) {
        url =
          `${API_URL}/products/${editingProduct._id}`;

        method = "PUT";
      } else {
        url =
          `${API_URL}/products`;

        method = "POST";
      }

      const response = await fetch(
        url,
        {
          method,
          headers: getHeaders(),
          body: JSON.stringify(body),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Something went wrong"
        );
      }

      alert(
        editingProduct
          ? "Product updated successfully."
          : "Product added successfully."
      );

      setShowModal(false);
      setEditingProduct(null);
      resetForm();

      await fetchProducts(false);
    } catch (error) {
      console.log(
        "SAVE PRODUCT ERROR:",
        error
      );

      alert(
        error.message ||
          "Error saving product"
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // UPDATE PRICE
  // ============================================================

  const handlePriceUpdate = async (
    product,
    newPrice
  ) => {
    const price =
      Number(newPrice);

    if (
      newPrice === "" ||
      isNaN(price) ||
      price < 0
    ) {
      alert(
        "Please enter a valid price."
      );

      return;
    }

    if (
      price === Number(product.price)
    ) {
      return;
    }

    try {
      setUpdatingPrice(
        (previous) => ({
          ...previous,
          [product._id]: true,
        })
      );

      const response =
        await fetch(
          `${API_URL}/products/${product._id}`,
          {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify({
              price,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update price"
        );
      }

      setProducts(
        (previousProducts) =>
          previousProducts.map(
            (item) =>
              item._id === product._id
                ? {
                    ...item,
                    price,
                  }
                : item
          )
      );
    } catch (error) {
      alert(
        error.message ||
          "Error updating price"
      );
    } finally {
      setUpdatingPrice(
        (previous) => ({
          ...previous,
          [product._id]: false,
        })
      );
    }
  };

  // ============================================================
  // UPDATE DISCOUNT
  // ============================================================

  const handleDiscountUpdate = async (
    product,
    newDiscount
  ) => {
    const discount =
      Number(newDiscount);

    if (
      newDiscount === "" ||
      isNaN(discount) ||
      discount < 0 ||
      discount > 100
    ) {
      alert(
        "Discount must be between 0% and 100%."
      );

      return;
    }

    const oldDiscount =
      Number(
        product.discount || 0
      );

    if (
      discount === oldDiscount
    ) {
      return;
    }

    try {
      setUpdatingDiscount(
        (previous) => ({
          ...previous,
          [product._id]: true,
        })
      );

      const response =
        await fetch(
          `${API_URL}/products/${product._id}`,
          {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify({
              discount,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update discount"
        );
      }

      setProducts(
        (previousProducts) =>
          previousProducts.map(
            (item) =>
              item._id === product._id
                ? {
                    ...item,
                    discount,
                  }
                : item
          )
      );
    } catch (error) {
      alert(
        error.message ||
          "Error updating discount"
      );
    } finally {
      setUpdatingDiscount(
        (previous) => ({
          ...previous,
          [product._id]: false,
        })
      );
    }
  };

  // ============================================================
  // UPDATE AVAILABILITY
  // ============================================================

  const handleAvailabilityToggle =
    async (product) => {
      const newAvailability =
        !product.availability;

      try {
        setUpdatingAvailability(
          (previous) => ({
            ...previous,
            [product._id]: true,
          })
        );

        const response =
          await fetch(
            `${API_URL}/products/${product._id}`,
            {
              method: "PUT",
              headers: getHeaders(),
              body: JSON.stringify({
                availability:
                  newAvailability,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to update availability"
          );
        }

        setProducts(
          (previousProducts) =>
            previousProducts.map(
              (item) =>
                item._id === product._id
                  ? {
                      ...item,
                      availability:
                        newAvailability,
                    }
                  : item
            )
        );
      } catch (error) {
        alert(
          error.message ||
            "Error updating availability"
        );
      } finally {
        setUpdatingAvailability(
          (previous) => ({
            ...previous,
            [product._id]: false,
          })
        );
      }
    };

  // ============================================================
  // DELETE
  // ============================================================

  const handleDelete = async (
    product
  ) => {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${product.name}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      const response =
        await fetch(
          `${API_URL}/products/${product._id}`,
          {
            method: "DELETE",
            headers: getHeaders(),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to delete product"
        );
      }

      alert(
        "Product deleted successfully."
      );

      await fetchProducts(false);
    } catch (error) {
      alert(
        error.message ||
          "Error deleting product"
      );
    }
  };

  // ============================================================
  // CLEAR FILTERS
  // ============================================================

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("");
    setBrandFilter("");
    setAvailabilityFilter("");
  };

  // ============================================================
  // CATEGORY NAME
  // ============================================================

  const getCategoryName = (
    product
  ) => {
    if (
      product.category &&
      typeof product.category ===
        "object"
    ) {
      return (
        product.category.name ||
        "—"
      );
    }

    const category =
      categories.find(
        (item) =>
          item._id ===
          product.category
      );

    return category
      ? category.name
      : "—";
  };

  // ============================================================
  // BRAND NAME
  // ============================================================

  const getBrandName = (
    product
  ) => {
    if (
      product.brand &&
      typeof product.brand ===
        "object"
    ) {
      return (
        product.brand.name ||
        "—"
      );
    }

    const brand =
      brands.find(
        (item) =>
          item._id ===
          product.brand
      );

    return brand
      ? brand.name
      : "—";
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (
    loading &&
    products.length === 0
  ) {
    return (
      <div className="products-page">
        <div className="products-loading">
          <div className="products-spinner" />
          <p>
            Loading products...
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="products-page">

      <div className="products-header">

        <div>
          <h1>Products</h1>

          <p>
            Manage your products,
            prices and discounts.
          </p>
        </div>

        <button
          type="button"
          className="add-product-button"
          onClick={openAddModal}
        >
          + Add Product
        </button>

      </div>

      {/* FILTERS */}

      <div className="products-filters">

        <div className="search-box">

          <span className="search-icon">
            🔍
          </span>

          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          />

        </div>

        <select
          value={categoryFilter}
          onChange={(event) =>
            setCategoryFilter(
              event.target.value
            )
          }
        >
          <option value="">
            All Categories
          </option>

          {categories.map(
            (category) => (
              <option
                key={category._id}
                value={category._id}
              >
                {category.name}
              </option>
            )
          )}

        </select>

        <select
          value={brandFilter}
          onChange={(event) =>
            setBrandFilter(
              event.target.value
            )
          }
        >
          <option value="">
            All Brands
          </option>

          {brands.map(
            (brand) => (
              <option
                key={brand._id}
                value={brand._id}
              >
                {brand.name}
              </option>
            )
          )}

        </select>

        <select
          value={availabilityFilter}
          onChange={(event) =>
            setAvailabilityFilter(
              event.target.value
            )
          }
        >
          <option value="">
            All Status
          </option>

          <option value="true">
            Available
          </option>

          <option value="false">
            Unavailable
          </option>

        </select>

        {(search ||
          categoryFilter ||
          brandFilter ||
          availabilityFilter) && (
          <button
            type="button"
            className="clear-filters-button"
            onClick={clearFilters}
          >
            Clear
          </button>
        )}

      </div>

      {/* ERROR */}

      {error && (
        <div className="products-error">

          <strong>Error</strong>

          <span>{error}</span>

          <button
            type="button"
            onClick={() =>
              fetchProducts(false)
            }
          >
            Try Again
          </button>

        </div>
      )}

      {/* COUNT */}

      <div className="products-count">

        <span>
          {products.length} product
          {products.length !== 1
            ? "s"
            : ""}
        </span>

        {loading && (
          <span>
            Updating...
          </span>
        )}

      </div>

      {/* TABLE */}

      <div className="products-table-container">

        <table className="products-table-real">

          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Brand</th>
              <th>Price</th>
              <th>Discount</th>
              <th>Final Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>

            {products.length === 0 ? (

              <tr>
                <td
                  colSpan="8"
                  className="products-empty"
                >
                  <div>

                    <span className="empty-icon">
                      📦
                    </span>

                    <h3>
                      No products found
                    </h3>

                    <p>
                      Try changing your
                      search or filters.
                    </p>

                  </div>
                </td>
              </tr>

            ) : (

              products.map(
                (product) => {

                  const discount =
                    Number(
                      product.discount ||
                        0
                    );

                  const finalPrice =
                    calculateDiscountedPrice(
                      product.price,
                      discount
                    );

                  return (
                    <tr
                      key={
                        product._id
                      }
                    >

                      <td>

                        <div className="product-cell">

                          <div className="product-image">

                            {product.image ? (
                              <img
                                src={getImageUrl(
                                  product.image
                                )}
                                alt={
                                  product.name
                                }
                                onError={(
                                  event
                                ) => {
                                  event.currentTarget.style.display =
                                    "none";
                                }}
                              />
                            ) : (
                              <span>
                                📦
                              </span>
                            )}

                          </div>

                          <div>

                            <strong>
                              {
                                product.name
                              }
                            </strong>

                            {product.description && (
                              <small>
                                {
                                  product.description
                                }
                              </small>
                            )}

                          </div>

                        </div>

                      </td>

                      <td>
                        {getCategoryName(
                          product
                        )}
                      </td>

                      <td>
                        {getBrandName(
                          product
                        )}
                      </td>

                      <td>

                        <input
                          type="number"
                          className="table-price-input"
                          defaultValue={
                            product.price
                          }
                          min="0"
                          step="0.01"
                          disabled={
                            updatingPrice[
                              product._id
                            ]
                          }
                          onBlur={(
                            event
                          ) =>
                            handlePriceUpdate(
                              product,
                              event.target.value
                            )
                          }
                          onKeyDown={(
                            event
                          ) => {
                            if (
                              event.key ===
                              "Enter"
                            ) {
                              event.target.blur();
                            }
                          }}
                        />

                      </td>

                      <td>

                        <div className="discount-input-wrapper">

                          <input
                            type="number"
                            className="table-discount-input"
                            defaultValue={
                              discount
                            }
                            min="0"
                            max="100"
                            step="1"
                            disabled={
                              updatingDiscount[
                                product._id
                              ]
                            }
                            onBlur={(
                              event
                            ) =>
                              handleDiscountUpdate(
                                product,
                                event.target.value
                              )
                            }
                            onKeyDown={(
                              event
                            ) => {
                              if (
                                event.key ===
                                "Enter"
                              ) {
                                event.target.blur();
                              }
                            }}
                          />

                          <span>
                            %
                          </span>

                        </div>

                      </td>

                      <td>

                        <div className="final-price-cell">

                          {discount > 0 ? (
                            <>
                              <strong>
                                {finalPrice.toFixed(
                                  2
                                )}
                              </strong>

                              <small>
                                {Number(
                                  product.price
                                ).toFixed(
                                  2
                                )}
                              </small>
                            </>
                          ) : (
                            <strong>
                              {Number(
                                product.price
                              ).toFixed(
                                2
                              )}
                            </strong>
                          )}

                        </div>

                      </td>

                      <td>

                        <button
                          type="button"
                          className={`availability-switch ${
                            product.availability
                              ? "switch-on"
                              : "switch-off"
                          } ${
                            updatingAvailability[
                              product._id
                            ]
                              ? "switch-loading"
                              : ""
                          }`}
                          onClick={() =>
                            handleAvailabilityToggle(
                              product
                            )
                          }
                          disabled={
                            updatingAvailability[
                              product._id
                            ]
                          }
                        >

                          <span className="switch-track">

                            <span className="switch-thumb">
                              {product.availability
                                ? "✓"
                                : "×"}
                            </span>

                          </span>

                        </button>

                      </td>

                      <td>

                        <div className="product-actions">

                          <button
                            type="button"
                            className="edit-product-button"
                            onClick={() =>
                              openEditModal(
                                product
                              )
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="delete-product-button"
                            onClick={() =>
                              handleDelete(
                                product
                              )
                            }
                          >
                            Delete
                          </button>

                        </div>

                      </td>

                    </tr>
                  );
                }
              )

            )}

          </tbody>

        </table>

      </div>

      {/* =====================================================
          MODAL
      ===================================================== */}

      {showModal && (

        <div
          className="product-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
        >

          <div className="product-modal">

            <div className="product-modal-header">

              <div>

                <h2>
                  {editingProduct
                    ? "Edit Product"
                    : "Add Product"}
                </h2>

                <p>
                  {editingProduct
                    ? "Update product information."
                    : "Add a new product to your store."}
                </p>

              </div>

              <button
                type="button"
                className="modal-close-button"
                onClick={closeModal}
              >
                ✕
              </button>

            </div>

            <form
              className="product-form"
              onSubmit={handleSubmit}
            >

              {/* NAME */}

              <div className="form-group">

                <label>
                  Product Name *
                </label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter product name"
                  required
                />

              </div>

              {/* DESCRIPTION */}

              <div className="form-group">

                <label>
                  Description
                </label>

                <textarea
                  name="description"
                  value={
                    form.description
                  }
                  onChange={handleChange}
                  placeholder="Enter product description"
                  rows="3"
                />

              </div>

              {/* PRICE + DISCOUNT */}

              <div className="form-row">

                <div className="form-group">

                  <label>
                    Original Price *
                  </label>

                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />

                </div>

                <div className="form-group">

                  <label>
                    Discount %
                  </label>

                  <input
                    type="number"
                    name="discount"
                    value={
                      form.discount
                    }
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                    max="100"
                    step="1"
                  />

                </div>

              </div>

              {/* PRICE PREVIEW */}

              <div className="discount-preview">

                <div>
                  <span>
                    Original price
                  </span>

                  <strong>
                    {Number(
                      form.price || 0
                    ).toFixed(2)}
                  </strong>
                </div>

                <div>
                  <span>
                    Discount
                  </span>

                  <strong>
                    {Number(
                      form.discount || 0
                    )}
                    %
                  </strong>
                </div>

                <div>
                  <span>
                    Final price
                  </span>

                  <strong className="discounted-preview-price">
                    {calculateDiscountedPrice(
                      form.price,
                      form.discount
                    ).toFixed(2)}
                  </strong>
                </div>

              </div>

              {/* IMAGE UPLOAD / DRAG & DROP */}

              <div className="form-group">

                <label>
                  Product Image *
                </label>

                <label
                  htmlFor="product-image-input"
                  className={`image-upload-box ${
                    isDraggingImage
                      ? "image-upload-dragging"
                      : ""
                  } ${
                    imagePreview
                      ? "has-image"
                      : ""
                  }`}
                  onDragOver={
                    handleImageDragOver
                  }
                  onDragEnter={
                    handleImageDragOver
                  }
                  onDragLeave={
                    handleImageDragLeave
                  }
                  onDrop={
                    handleImageDrop
                  }
                >

                  {imagePreview ? (

                    <div className="image-upload-preview-wrapper">

                      <img
                        src={imagePreview}
                        alt="Product preview"
                        className="image-upload-preview"
                      />

                      <div className="image-upload-overlay">

                        <strong>
                          Drop another image
                          or click to replace
                        </strong>

                      </div>

                    </div>

                  ) : (

                    <div className="image-upload-placeholder">

                      <div className="upload-icon">
                        📷
                      </div>

                      <strong>
                        Drag & Drop your image here
                      </strong>

                      <span>
                        or click to browse
                      </span>

                      <small>
                        JPG, PNG, WEBP or GIF
                        <br />
                        Maximum 5 MB
                      </small>

                    </div>

                  )}

                </label>

                <input
                  id="product-image-input"
                  className="hidden-file-input"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  onChange={
                    handleImageChange
                  }
                  disabled={
                    saving ||
                    uploadingImage
                  }
                />

                {imageFile && (
                  <div className="selected-image-info">

                    <span>
                      📎 {imageFile.name}
                    </span>

                    <span>
                      Ready to upload
                    </span>

                  </div>
                )}

                {editingProduct &&
                  !imageFile && (
                    <small className="current-image-text">
                      Current image is
                      already uploaded.
                      Drag & drop or choose
                      another image only if
                      you want to replace it.
                    </small>
                  )}

              </div>

              {/* CATEGORY + BRAND */}

              <div className="form-row">

                <div className="form-group">

                  <label>
                    Category *
                  </label>

                  <select
                    name="category"
                    value={
                      form.category
                    }
                    onChange={handleChange}
                    required
                  >

                    <option value="">
                      Select category
                    </option>

                    {categories.map(
                      (category) => (
                        <option
                          key={
                            category._id
                          }
                          value={
                            category._id
                          }
                        >
                          {
                            category.name
                          }
                        </option>
                      )
                    )}

                  </select>

                </div>

                <div className="form-group">

                  <label>
                    Brand *
                  </label>

                  <select
                    name="brand"
                    value={form.brand}
                    onChange={handleChange}
                    required
                  >

                    <option value="">
                      Select brand
                    </option>

                    {brands.map(
                      (brand) => (
                        <option
                          key={
                            brand._id
                          }
                          value={
                            brand._id
                          }
                        >
                          {
                            brand.name
                          }
                        </option>
                      )
                    )}

                  </select>

                </div>

              </div>

              {/* AVAILABILITY */}

              <div className="modal-availability-row">

                <span>
                  Product availability
                </span>

                <button
                  type="button"
                  className={`availability-switch modal-switch ${
                    form.availability
                      ? "switch-on"
                      : "switch-off"
                  }`}
                  onClick={() =>
                    setForm(
                      (previous) => ({
                        ...previous,
                        availability:
                          !previous.availability,
                      })
                    )
                  }
                >

                  <span className="switch-track">

                    <span className="switch-thumb">
                      {form.availability
                        ? "✓"
                        : "×"}
                    </span>

                  </span>

                </button>

              </div>

              {/* ACTIONS */}

              <div className="product-form-actions">

                <button
                  type="button"
                  className="cancel-product-button"
                  onClick={closeModal}
                  disabled={
                    saving ||
                    uploadingImage
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-product-button"
                  disabled={
                    saving ||
                    uploadingImage
                  }
                >
                  {uploadingImage
                    ? "Uploading image..."
                    : saving
                    ? "Saving..."
                    : editingProduct
                    ? "Update Product"
                    : "Add Product"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default Products;
