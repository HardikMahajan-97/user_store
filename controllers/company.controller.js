import Company from "../models/company.model.js";

export const createCompany = async (req, res) => {
  const { name, email, contactPerson, phone, website, logo, description } =
    req.body;

  if (!name?.trim() || !email?.trim() || !contactPerson?.trim()) {
    return res.status(400).json({
      message: "Name, email, and contact person are required",
    });
  }

  try {
    const companyExists = await Company.findOne({ email });

    if (companyExists) {
      return res.status(400).json({
        message: "Company with this email already exists",
      });
    }

    const company = await Company.create({
      name,
      email,
      contactPerson,
      phone,
      website,
      logo,
      description,
    });

    res.status(201).json({
      message: "Company created successfully",
      company,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find({ isActive: true }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      message: "Companies fetched successfully",
      companies,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const getCompanyById = async (req, res) => {
  const { id } = req.params;

  try {
    const company = await Company.findById(id);

    if (!company) {
      return res.status(404).json({
        message: "Company not found",
      });
    }

    res.status(200).json({
      message: "Company fetched successfully",
      company,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const updateCompany = async (req, res) => {
  const { id } = req.params;
  const { name, email, contactPerson, phone, website, logo, description } =
    req.body;

  try {
    const company = await Company.findById(id);

    if (!company) {
      return res.status(404).json({
        message: "Company not found",
      });
    }

    if (name) company.name = name;
    if (email && email !== company.email) {
      const exists = await Company.findOne({ email });
      if (exists) {
        return res.status(400).json({
          message: "Email already in use",
        });
      }
      company.email = email;
    }
    if (contactPerson) company.contactPerson = contactPerson;
    if (phone) company.phone = phone;
    if (website) company.website = website;
    if (logo) company.logo = logo;
    if (description) company.description = description;

    await company.save();

    res.status(200).json({
      message: "Company updated successfully",
      company,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const deleteCompany = async (req, res) => {
  const { id } = req.params;

  try {
    const company = await Company.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!company) {
      return res.status(404).json({
        message: "Company not found",
      });
    }

    res.status(200).json({
      message: "Company deleted successfully",
      company,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
