import React, { useState } from 'react';
import './UsersList.css';
import logo from '../../../media/eco-soap-logo.png';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, gql } from '@apollo/client';
import 'react-responsive-modal/styles.css';
import { Modal } from 'react-responsive-modal';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers';
import { useForm } from 'react-hook-form';

const schema = yup.object().shape({
  email: yup
    .string()
    .required('Email required')
    .email('Email is required'),
  // PASSWORD RESTRICTIONS: minimum of 8 chars, one uppercase, one lowercase, one digit
  password: yup
    .string()
    .matches(
      /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/,
      'Must Contain 8 Characters, a Uppercase, a Lowercase, and a Number.'
    ),
});

// Three queries/mutations below make calls to our backend graphQL.
// Graph QL query to get all users
const GET_USER_QUERY = gql`
  query getUsers {
    users {
      id
      email
      password
    }
  }
`;

// Graph QL Mutation to edit user information
const EDIT_USER_MUTATION = gql`
  mutation editUser($userId: ID!, $email: String!, $password: String!) {
    updateUserProfile(
      input: { userId: $userId, email: $email, password: $password }
    ) {
      user {
        id
        email
        password
      }
    }
  }
`;

// Graph QL Mutation to delete a user from the database
const DELETE_ADMIN_MUTATION = gql`
  mutation deleteAdmin($email: String!) {
    deleteUser(input: { email: $email }) {
      success
      error
    }
  }
`;

const UsersList = () => {
  // State variables, for Form Modal, and Form State.
  const [open, setOpen] = useState(false);
  const [userInfo, setUserInfo] = useState('');

  // Form Authenticator below
  const { register, handleSubmit, errors } = useForm({
    resolver: yupResolver(schema),
  });

  // useMutation/useQuery hooks come from ApolloClient, allows us to connect the Front-End with the Backend GraphQL API.
  const [deleteAdmin] = useMutation(DELETE_ADMIN_MUTATION, {
    refetchQueries: ['getUsers'],
  });
  const [editUser] = useMutation(EDIT_USER_MUTATION, {
    refetchQueries: ['getUsers'],
  });
  const { loading, error, data } = useQuery(GET_USER_QUERY);
  const deleteFunc = (e, email) => {
    e.preventDefault();
    deleteAdmin({
      variables: { email: email },
    });
  };

  // Opens Form Modal
  const onOpenModal = (id, email, password) => {
    setUserInfo({
      id: id,
      email: email,
      password: password,
    });
    setOpen(true);
  };

  // Closes Form Modal
  const onCloseModal = () => {
    setUserInfo({
      id: '',
      email: '',
      password: '',
    });
    setOpen(false);
  };

  // Handles changes in the form
  const handleChange = event => {
    setUserInfo({
      ...userInfo,
      [event.target.name]: event.target.value,
    });
  };

  // Handles the form submit
  const onSubmit = () => {
    editUser({
      variables: {
        userId: userInfo.id,
        email: userInfo.email,
        password: userInfo.password,
      },
    });
    // Line below can be added, if we want to CLOSE the form when Admin updates user, but this will conflict a bit with
    onCloseModal();
  };

  return (
    <div className="header">
      <div>
        <img className="eco-soap-logo" src={logo} alt="eco-soap bank logo" />
      </div>
      <h1 className="title">Admin Users</h1>
      Back to <Link to="/dashboard">Dashboard</Link>
      <div className="page">
        <div className="users-form">
          {loading && <p>Loading...</p>}
          {error && (
            <p>
              We're experiencing errors with the API! Please come back later.
            </p>
          )}
          <Modal open={open} onClose={onCloseModal} center>
            <h1>Edit user: </h1>
            <form onSubmit={handleSubmit(onSubmit)}>
              <label>
                <input
                  placeholder="E-mail*"
                  type="text"
                  name="email"
                  value={userInfo.email}
                  onChange={event => handleChange(event)}
                  ref={register}
                />
                {errors.email && (
                  <p className="error">{errors.email.message}</p>
                )}
              </label>
              <br />

              <label>
                <input
                  placeholder="Password*"
                  type="text"
                  name="password"
                  value={userInfo.password}
                  onChange={event => handleChange(event)}
                  ref={register}
                />
                {errors.password && (
                  <p className="error">{errors.password.message}</p>
                )}
              </label>
              <br />

              <input type="submit" value="Update Admin" />
            </form>
          </Modal>
          {data &&
            data.users.map(({ id, email, password }) => (
              <div className="user-card" key={id}>
                <p>{`User email: ${email}`}</p>
                <p>{`User password: ${password}`}</p>
                <button
                  onClick={e => onOpenModal(id, email, password)}
                  className="button-modify"
                >
                  Modify
                </button>
                <button
                  className="button-delete"
                  onClick={e => deleteFunc(e, email)}
                >
                  Delete
                </button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default UsersList;
