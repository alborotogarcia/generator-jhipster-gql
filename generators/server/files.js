const nodejsConstants = require('generator-jhipster-nodejs/generators/generator-nodejs-constants');
const utils = require('../util');

module.exports = {
    writeFiles
};

const serverFiles = {
    graphQL: [
        {
            templates: [
                'server/src/service/graphql/paginated.object-type.ts',
                'server/src/service/graphql/user.object-type.ts',
                'server/src/web/graphql/pagination-util.ts',
                'server/src/web/graphql/user.resolver.ts'
            ]
        }
    ]
};

function adjustAppModule(tsProject) {
    const filePath = `${nodejsConstants.SERVER_NODEJS_SRC_DIR}/src/app.module.ts`;
    const appModule = tsProject.getSourceFile(filePath);

    // add TypeScript module imports
    const added = utils.addImportIfMissing(appModule, { moduleSpecifier: '@nestjs/graphql', namedImport: 'GraphQLModule' })
    utils.addImportIfMissing(appModule, { moduleSpecifier: 'path', namedImport: 'join' });

    if (added) {
        // add NestJS module import
        const _class = appModule.getClass(() => true);
        const moduleDecorator = _class.getDecorator('Module');
        const moduleImports = moduleDecorator.getArguments()[0].getProperty('imports').getInitializer();
        const graphQLimportAssignment =
            `GraphQLModule.forRoot({
    installSubscriptionHandlers: true,
    autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
    buildSchemaOptions: {
        numberScalarMode: 'integer'
    }
})`;
        moduleImports.insertElement(moduleImports.getElements().length - 1, graphQLimportAssignment);
    }
    appModule.saveSync();
}

function adjustUserModule(tsProject) {
    const filePath = `${nodejsConstants.SERVER_NODEJS_SRC_DIR}/src/module/user.module.ts`;
    const userModule = tsProject.getSourceFile(filePath);

    // add TypeScript module imports
    const added = utils.addImportIfMissing(userModule, { moduleSpecifier: '../web/graphql/user.resolver', namedImport: 'UserResolver' });

    if (added) {
        // add User resolver to providers
        const _class = userModule.getClass(() => true);
        const moduleDecorator = _class.getDecorator('Module');
        const moduleProviders = moduleDecorator.getArguments()[0].getProperty('providers').getInitializer();
        moduleProviders.addElement('UserResolver');
    }
    userModule.saveSync();
}

function adjustBaseDTO(tsProject) {
    const filePath = `${nodejsConstants.SERVER_NODEJS_SRC_DIR}/src/service/dto/base.dto.ts`;
    const dto = tsProject.getSourceFile(filePath);

    // add graphql module imports
    const addedFieldImport = utils.addImportIfMissing(dto, { moduleSpecifier: '@nestjs/graphql', namedImport: 'Field' })
    const addedInputTypeImport = utils.addImportIfMissing(dto, { moduleSpecifier: '@nestjs/graphql', namedImport: 'InputType' })
    const addedObjectTypeImport = utils.addImportIfMissing(dto, { moduleSpecifier: '@nestjs/graphql', namedImport: 'ObjectType' });
    const added = addedFieldImport || addedInputTypeImport || addedObjectTypeImport;

    if (added) {
        // add class decorators
        const _class = dto.getClass(() => true);
        _class.addDecorator({ name: 'ObjectType', arguments: [] });
        _class.addDecorator({ name: 'InputType', arguments: [] });
        // add id decorator
        _class.getInstanceProperty('id').addDecorator({ name: 'Field', arguments: [`{nullable: false}`] });
    }
    dto.saveSync();
}

function adjustUserDTO(tsProject) {
    const filePath = `${nodejsConstants.SERVER_NODEJS_SRC_DIR}/src/service/dto/user.dto.ts`;
    const dto = tsProject.getSourceFile(filePath);

    const addedInputTypeImport = utils.addImportIfMissing(dto, { moduleSpecifier: '@nestjs/graphql', namedImport: 'InputType' })
    const addedObjectTypeImport = utils.addImportIfMissing(dto, { moduleSpecifier: '@nestjs/graphql', namedImport: 'ObjectType' });
    const addedHideFieldImport = utils.addImportIfMissing(dto, { moduleSpecifier: '@nestjs/graphql', namedImport: 'HideField' });
    const added = addedInputTypeImport || addedObjectTypeImport || addedHideFieldImport;

    if (added) {
        // add class decorators
        const _class = dto.getClass(() => true);
        _class.addDecorator({ name: 'ObjectType', arguments: [] });
        _class.addDecorator({ name: 'InputType', arguments: [`'_user'`] });
        // adjust type of authorities
        _class.getInstanceProperty('authorities').setType(`string[]`);
        // add password decorator
        _class.getInstanceProperty('password').addDecorator({ name: 'HideField', arguments: [] });

    }
    dto.saveSync();
}

function writeFiles() {
    return {
        writeGraphQLFiles() {
            this.writeFilesToDisk(serverFiles, this, false);
        },
        adjustFiles() {
            const tsProject = utils.getTsProject(true);
            adjustAppModule(tsProject);
            adjustUserModule(tsProject);
            adjustBaseDTO(tsProject);
            adjustUserDTO(tsProject);
        }
    }
}
