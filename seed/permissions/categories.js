const mongoose = require('mongoose');
const config = require('config');
const Models = require('../../models');

const categories = [
  // Pesticides
  {
    name: "Pesticides",
    description: "Chemical substances used to control, repel, or eliminate pests",
    parentCategory: null
  },
  {
    name: "Insecticides",
    description: "Substances used to kill or control insects",
    parentCategory: "Pesticides"
  },
  {
    name: "Herbicides",
    description: "Substances used to control unwanted plants/weeds",
    parentCategory: "Pesticides"
  },
  {
    name: "Fungicides",
    description: "Substances used to kill or inhibit fungi and their spores",
    parentCategory: "Pesticides"
  },

  // Fertilizers
  {
    name: "Fertilizers",
    description: "Substances used to provide nutrients to plants",
    parentCategory: null
  },
  {
    name: "Organic Fertilizers",
    description: "Natural fertilizers derived from animal or plant matter",
    parentCategory: "Fertilizers"
  },
  {
    name: "Chemical Fertilizers",
    description: "Synthetic fertilizers manufactured from chemical substances",
    parentCategory: "Fertilizers"
  },
  {
    name: "Bio Fertilizers",
    description: "Fertilizers containing living microorganisms",
    parentCategory: "Fertilizers"
  },

  // Plant Growth Regulators
  {
    name: "Plant Growth Regulators",
    description: "Substances that influence plant growth and development",
    parentCategory: null
  },
  {
    name: "Growth Promoters",
    description: "Substances that enhance plant growth",
    parentCategory: "Plant Growth Regulators"
  },
  {
    name: "Growth Inhibitors",
    description: "Substances that restrict or regulate plant growth",
    parentCategory: "Plant Growth Regulators"
  },

  // Seeds
  {
    name: "Seeds",
    description: "Agricultural seeds for various crops",
    parentCategory: null
  },
  {
    name: "Hybrid Seeds",
    description: "Seeds produced by cross-pollinated plants",
    parentCategory: "Seeds"
  },
  {
    name: "GMO Seeds",
    description: "Genetically modified seeds",
    parentCategory: "Seeds"
  },
  {
    name: "Organic Seeds",
    description: "Naturally produced seeds without genetic modification",
    parentCategory: "Seeds"
  }
];

module.exports = categories;
