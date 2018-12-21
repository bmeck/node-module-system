Simple example of running a virtual Node.js module system.

Use:

```console
> node run-main-node.js node-app
```

To see example of running an Express application.

Note that the bootstrap does freeze the default `require.cache` to ensure it won't load anything new outside of our virtual module system.
