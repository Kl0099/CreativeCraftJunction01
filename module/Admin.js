const express = require("express")
const mongoose = require("mongoose")
const Schema = mongoose.Schema
const jwt = require("jsonwebtoken")
const passport = require("passport")

const AdminSchema = new Schema({
    ContactNumber: {
        type: Number,
        required: true
    },
    email: {
        type: String,
        required: true,
    }
}, { timestamps: true })

const Admin = new mongoose.model("Admin", AdminSchema)
module.exports = Admin