const graphql = require('graphql');
const { GraphQLInt } = require('graphql/type');
const knex = require('../db');

const UserType = new graphql.GraphQLObjectType({
  name: 'User',
  fields: () => {
    return {
      id: {
        type: graphql.GraphQLID,
        resolve(user) {
          return user.id;
        }
      },
      username: {
        type: graphql.GraphQLString,
        resolve(user) {
          return user.username;
        }
      },
      isAdmin: {
        type: graphql.GraphQLBoolean,
        resolve(user) {
          return user.role == 'admin';
        }
      },
      booksRead: {
        type: graphql.GraphQLList(HasReadType),
        resolve(user) {
          return knex('hasRead').where('userId', user.id);
        }
      },
      avgRating: {
        type: graphql.GraphQLFloat,
        async resolve(user) {
          let q = await knex('hasRead').where('userId', user.id).avg('rating as avg__rating').first();
          return q['avg__rating'];
        }
      }
    }
  }
});

const BookType = new graphql.GraphQLObjectType({
  name: 'Book',
  fields: {
    id: {
      type: graphql.GraphQLID,
      resolve(book) {
        return book.id;
      }
    },
    title: {
      type: graphql.GraphQLString,
      resolve(book) {
        return book.title;
      }
    },
    author: {
      type: graphql.GraphQLString,
      resolve(book) {
        return book.author;
      }
    },
    fiction: {
      type: graphql.GraphQLBoolean,
      resolve(book) {
        return book.fiction;
      }
    },
    publishedYear: {
      type: graphql.GraphQLInt,
      resolve(book) {
        return book.publishedYear;
      }
    },
  }
});

const HasReadType = new graphql.GraphQLObjectType({
  name: 'HasRead',
  fields: {
    rating: {
      type: graphql.GraphQLInt,
      resolve(hasRead) {
        return hasRead.rating;
      }
    },
    book: {
      type: BookType,
      resolve(hasRead) {
        return knex('book').where('id', hasRead.bookId).first();
      }
    }
  }
});

const queryType = new graphql.GraphQLObjectType({
  name: 'Query',
  fields: {
    users: {
      type: graphql.GraphQLList(UserType),
      resolve (root) {
        return knex('user');
      }
    },
    books: {
      type: graphql.GraphQLList(BookType),
      args: {
        fiction: {
          type: graphql.GraphQLBoolean
        }
      },
      resolve(root, args, context) {
        let q = knex('book');
        if (args.fiction !== undefined) {
          q = q.where('fiction', args.fiction);
        }
        return q;
      }
    },
    book: {
      type: BookType,
      args: {
        id: {
          type: graphql.GraphQLNonNull(graphql.GraphQLID)
        }
      },
      resolve(root, args, context) {
        const id = args.id;
        return knex('book').where('id', id).first();
      }
    }
  }
});

const schema = new graphql.GraphQLSchema({query: queryType});

module.exports = schema;
